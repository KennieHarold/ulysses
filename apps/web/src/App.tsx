import { useCallback, useState } from 'react';
import { IDKitRequestWidget, selfieCheckLegacy } from '@worldcoin/idkit';
import type { IDKitResult } from '@worldcoin/idkit';
import type { RpContextResponse, VerifyResponse } from '@ulysses/shared';
import { webConfig } from './config';
import { ERROR_GUIDANCE } from './errorMessages';

type Phase = 'idle' | 'signing' | 'awaiting' | 'verifying' | 'success' | 'error';

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Ready',
  signing: 'Requesting RP signature…',
  awaiting: 'Waiting for World App — scan the QR, then complete the Selfie Check',
  verifying: 'Verifying proof server-side…',
  success: 'Verified',
  error: 'Failed',
};

export function App() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rpContext, setRpContext] = useState<RpContextResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setRpContext(null);
    setOpen(false);
    setNullifierHash(null);
    setDetail(null);
  }, []);

  const start = useCallback(async () => {
    setPhase('signing');
    setDetail(null);
    setNullifierHash(null);
    try {
      const response = await fetch(`${webConfig.apiBase}/rp/sign`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`/rp/sign returned ${response.status}: ${await response.text()}`);
      }
      const context = (await response.json()) as RpContextResponse;
      setRpContext(context);
      setPhase('awaiting');
      setOpen(true);
    } catch (error) {
      setPhase('error');
      setDetail(
        error instanceof Error
          ? `${error.message} — is the API running on ${webConfig.apiBase}?`
          : String(error),
      );
    }
  }, []);

  const handleVerify = useCallback(async (result: IDKitResult) => {
    setPhase('verifying');
    const response = await fetch(`${webConfig.apiBase}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      throw new Error(`/verify returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as VerifyResponse;
    if (!body.verified || !body.nullifierHash) {
      throw new Error(body.detail ?? 'Server-side verification failed.');
    }

    setNullifierHash(body.nullifierHash);
  }, []);

  const onSuccess = useCallback(() => {
    setPhase('success');
    setOpen(false);
  }, []);

  const onError = useCallback((code: string) => {
    setPhase('error');
    setOpen(false);
    setDetail(ERROR_GUIDANCE[code] ? `${code} — ${ERROR_GUIDANCE[code]}` : code);
  }, []);

  return (
    <main className="page">
      <header>
        <h1>Ulysses — Selfie Check smoke test</h1>
        <p className="sub">Milestone 0: prove one Selfie Check returns a verified nullifier.</p>
      </header>

      <section className="card">
        <dl className="meta">
          <div><dt>App</dt><dd>{webConfig.appId}</dd></div>
          <div><dt>Action</dt><dd>{webConfig.action}</dd></div>
          <div><dt>Signal</dt><dd>{webConfig.signal}</dd></div>
          <div><dt>Environment</dt><dd>{webConfig.environment}</dd></div>
          <div><dt>Legacy proofs</dt><dd>{String(webConfig.allowLegacyProofs)}</dd></div>
          <div><dt>API</dt><dd>{webConfig.apiBase}</dd></div>
        </dl>
      </section>

      <section className="card">
        <p className={`status status-${phase}`} role="status">
          <span className="dot" aria-hidden="true" />
          {PHASE_LABEL[phase]}
        </p>

        {phase === 'idle' || phase === 'error' ? (
          <button className="primary" onClick={() => void start()}>
            {phase === 'error' ? 'Try again' : 'Start Selfie Check'}
          </button>
        ) : null}

        {phase === 'success' && nullifierHash ? (
          <>
            <p className="label">Nullifier hash</p>
            <code className="nullifier">{nullifierHash}</code>
            <p className="hint">
              Run this again with the same Sandbox identity — the nullifier must be identical.
              Confirm in <code>GET {webConfig.apiBase}/verify/log</code>.
            </p>
            <button className="primary" onClick={() => void start()}>Run again</button>
            <button className="secondary" onClick={reset}>Reset</button>
          </>
        ) : null}

        {phase === 'error' && detail ? <p className="detail">{detail}</p> : null}
      </section>

      {rpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setPhase((current) => (current === 'awaiting' ? 'idle' : current));
          }}
          app_id={webConfig.appId}
          action={webConfig.action}
          rp_context={rpContext}
          allow_legacy_proofs={webConfig.allowLegacyProofs}
          environment={webConfig.environment}
          preset={selfieCheckLegacy({ signal: webConfig.signal })}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
          onError={onError}
        />
      ) : null}
    </main>
  );
}
