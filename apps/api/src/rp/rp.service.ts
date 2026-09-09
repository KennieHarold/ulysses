import { Injectable, Logger } from '@nestjs/common';
import { signRequest } from '@worldcoin/idkit-core/signing';
import type { RpContextResponse } from '@ulysses/shared';
import { appConfig } from '../common/config';

interface IssuedNonce {
  issuedAt: number;
  expiresAt: number;
}

@Injectable()
export class RpService {
  private readonly logger = new Logger(RpService.name);

  private readonly issued = new Map<string, IssuedNonce>();

  sign(): RpContextResponse {
    const signed = signRequest({
      signingKeyHex: appConfig.rpSigningKey,
      action: appConfig.actionId,
      ttl: appConfig.signatureTtlSeconds,
    });

    this.pruneExpired();
    this.issued.set(signed.nonce, {
      issuedAt: signed.createdAt,
      expiresAt: signed.expiresAt,
    });

    this.logger.log(
      `Issued rp_context nonce=${signed.nonce.slice(0, 12)}… action=${appConfig.actionId} ` +
        `ttl=${signed.expiresAt - signed.createdAt}s`,
    );

    return {
      rp_id: appConfig.rpId,
      nonce: signed.nonce,
      created_at: signed.createdAt,
      expires_at: signed.expiresAt,
      signature: signed.sig,
    };
  }

  wasIssued(nonce: string): boolean {
    this.pruneExpired();
    return this.issued.has(nonce);
  }

  private pruneExpired(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [nonce, meta] of this.issued) {
      if (meta.expiresAt + 600 < now) this.issued.delete(nonce);
    }
  }
}
