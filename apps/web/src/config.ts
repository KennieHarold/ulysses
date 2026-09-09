import { ULYSSES_ACTION_ID, SMOKETEST_SIGNAL } from '@ulysses/shared';

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env at the repo root and restart the dev server.`,
    );
  }
  return value;
}

const rawEnvironment = import.meta.env.VITE_WORLD_ENVIRONMENT ?? 'sandbox';
if (!['production', 'staging', 'sandbox'].includes(rawEnvironment)) {
  throw new Error(
    `VITE_WORLD_ENVIRONMENT must be production, staging or sandbox (got "${rawEnvironment}").`,
  );
}

export const webConfig = {
  appId: requireEnv('VITE_WORLD_APP_ID', import.meta.env.VITE_WORLD_APP_ID) as `app_${string}`,
  apiBase: (import.meta.env.VITE_API_BASE ?? 'http://localhost:3001').replace(/\/+$/, ''),
  action: ULYSSES_ACTION_ID,
  signal: SMOKETEST_SIGNAL,
  environment: rawEnvironment as 'production' | 'staging' | 'sandbox',
  allowLegacyProofs: (import.meta.env.VITE_ALLOW_LEGACY_PROOFS ?? 'true') !== 'false',
} as const;
