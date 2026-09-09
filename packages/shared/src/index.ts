export const ULYSSES_ACTION_ID = "ulysses-smoketest";

export const SMOKETEST_SIGNAL = "smoketest";

export interface RpContextResponse {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
}

export interface VerifyResponse {
  verified: boolean;
  nullifierHash: string | null;
  detail?: string;
}

export interface SmokeTestResult {
  nullifierHash: string;
  verifiedAt: string;
  action: string;
  protocolVersion: string;
  credential: string;
  environment: string;
  repeat: boolean;
}

export interface VerifyLogResponse {
  count: number;
  distinctNullifiers: number;
  entries: SmokeTestResult[];
}
