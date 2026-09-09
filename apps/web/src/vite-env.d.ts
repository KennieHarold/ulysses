/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORLD_APP_ID: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_WORLD_ENVIRONMENT?: string;
  readonly VITE_ALLOW_LEGACY_PROOFS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
