import { Injectable, Logger } from '@nestjs/common';
import { hashSignal } from '@worldcoin/idkit-core/hashing';
import type { SmokeTestResult, VerifyLogResponse, VerifyResponse } from '@ulysses/shared';
import { appConfig, verifyUrl } from '../common/config';
import { RpService } from '../rp/rp.service';
import type { IdkitResultDto } from './verify.dto';

class PreflightFailure extends Error {}

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);

  private readonly log: SmokeTestResult[] = [];

  constructor(private readonly rpService: RpService) {}

  async verify(result: IdkitResultDto): Promise<VerifyResponse> {
    try {
      this.preflight(result);
    } catch (error) {
      const detail = error instanceof PreflightFailure ? error.message : String(error);
      this.logger.warn(`Rejected before upstream: ${detail}`);
      return { verified: false, nullifierHash: null, detail };
    }

    const url = verifyUrl();
    let upstreamStatus = 0;
    let upstreamBody = '';

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (appConfig.apiKey) headers.Authorization = `Bearer ${appConfig.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(result),
      });

      upstreamStatus = response.status;
      upstreamBody = await response.text();

      if (!response.ok) {
        this.logger.error(
          `Verify failed: POST ${url} -> ${upstreamStatus}\nraw upstream body: ${upstreamBody}`,
        );
        return {
          verified: false,
          nullifierHash: null,
          detail: `Portal returned ${upstreamStatus}: ${truncate(upstreamBody)}`,
        };
      }

      const parsed = safeJson(upstreamBody);
      const ok =
        parsed !== null &&
        typeof parsed === 'object' &&
        (('success' in parsed && parsed.success === true) ||
          ('verified' in parsed && (parsed as Record<string, unknown>).verified === true));

      if (!ok) {
        this.logger.error(
          `Verify returned 200 but not a success payload: ${upstreamBody}`,
        );
        return {
          verified: false,
          nullifierHash: null,
          detail: `Portal returned 200 without success: ${truncate(upstreamBody)}`,
        };
      }

      const credential = result.responses[0];
      const nullifierHash = credential.nullifier;
      const repeat = this.log.some((entry) => entry.nullifierHash === nullifierHash);

      const entry: SmokeTestResult = {
        nullifierHash,
        verifiedAt: new Date().toISOString(),
        action: result.action ?? appConfig.actionId,
        protocolVersion: result.protocol_version,
        credential: credential.identifier,
        environment: result.environment ?? 'unknown',
        repeat,
      };
      this.log.push(entry);

      this.logger.log(
        `Verified nullifier=${nullifierHash} credential=${entry.credential} ` +
          `protocol=${entry.protocolVersion} env=${entry.environment} repeat=${repeat}`,
      );

      return { verified: true, nullifierHash };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Verify request threw: POST ${url} status=${upstreamStatus} ` +
          `raw upstream body: ${upstreamBody || '(none)'}\n${detail}`,
      );
      return { verified: false, nullifierHash: null, detail: `Verify request failed: ${detail}` };
    }
  }

  private preflight(result: IdkitResultDto): void {
    if (!this.rpService.wasIssued(result.nonce)) {
      throw new PreflightFailure(
        'Unknown or expired nonce. This result does not correspond to a signing request issued by this API.',
      );
    }

    if (result.action !== undefined && result.action !== appConfig.actionId) {
      throw new PreflightFailure(
        `Action mismatch: expected "${appConfig.actionId}", result carried "${result.action}".`,
      );
    }
    if (result.action === undefined && result.protocol_version.startsWith('4')) {
      throw new PreflightFailure('World ID 4.0 uniqueness proof is missing its action.');
    }

    const expected = normaliseHex(hashSignal(appConfig.signal));
    for (const item of result.responses) {
      if (item.signal_hash === undefined) {
        throw new PreflightFailure(
          `Credential "${item.identifier}" carried no signal_hash, but the request bound signal "${appConfig.signal}".`,
        );
      }
      if (normaliseHex(item.signal_hash) !== expected) {
        throw new PreflightFailure(
          `Signal hash mismatch on credential "${item.identifier}" — proof was not bound to "${appConfig.signal}".`,
        );
      }
    }
  }

  getLog(): VerifyLogResponse {
    return {
      count: this.log.length,
      distinctNullifiers: new Set(this.log.map((e) => e.nullifierHash)).size,
      entries: this.log,
    };
  }
}

function normaliseHex(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, '').replace(/^0+/, '');
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function truncate(text: string, max = 500): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
