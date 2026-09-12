/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_LIVE_MODE?: string
	readonly VITE_TRIGGER_URL?: string
	readonly VITE_TRIGGER_AUTH?: string
	readonly VITE_RESULT_URL?: string
	readonly VITE_ENCLAVE_PUBLIC_KEY?: string
	readonly VITE_DEMO_CALLDATA?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
