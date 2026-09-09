import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

loadDotenv({ path: resolve(__dirname, '../../../../.env') });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env at the repo root and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }
  return parsed;
}

export const appConfig = {
  appId: required('WORLD_APP_ID'),
  rpId: required('WORLD_RP_ID'),
  rpSigningKey: required('WORLD_RP_SIGNING_KEY'),
  apiKey: process.env.WORLD_API_KEY?.trim() || null,
  actionId: optional('WORLD_ACTION_ID', 'ulysses-smoketest'),
  signal: optional('WORLD_SIGNAL', 'smoketest'),
  apiBase: optional('WORLD_API_BASE', 'https://developer.worldcoin.org').replace(/\/+$/, ''),
  verifyPath: optional('WORLD_VERIFY_PATH', '/api/v4/verify/{rp_id}'),
  signatureTtlSeconds: int('RP_SIGNATURE_TTL_SECONDS', 300),
  port: int('PORT', 3001),
  webOrigin: optional('WEB_ORIGIN', 'http://localhost:5173'),
} as const;

export function verifyUrl(): string {
  return appConfig.apiBase + appConfig.verifyPath.replace('{rp_id}', appConfig.rpId);
}
