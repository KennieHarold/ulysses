const env = import.meta.env

const bool = (v: string | undefined, fallback: boolean): boolean =>
	v === undefined ? fallback : v.toLowerCase() === 'true'

export const config = {
	liveMode: bool(env.VITE_LIVE_MODE, false),
	triggerUrl: env.VITE_TRIGGER_URL || '/api/trigger',
	triggerAuth: env.VITE_TRIGGER_AUTH || '',
	resultUrl: env.VITE_RESULT_URL || '',
	enclavePublicKey:
		env.VITE_ENCLAVE_PUBLIC_KEY ||
		'0x375128744ecd24947690752d5fc2f80b48133372874dd28b16afbd5e610ff90b',
	demoTarget: env.VITE_DEMO_TARGET || '0x0000000000000000000000000000000000000000',
	demoNetwork: env.VITE_DEMO_NETWORK || 'eth-sepolia',
	demoToken: env.VITE_DEMO_TOKEN || 'native',
	demoCalldata: env.VITE_DEMO_CALLDATA || '0x9e5faafc',
} as const
