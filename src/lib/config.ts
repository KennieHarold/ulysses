const env = import.meta.env

const bool = (v: string | undefined, fallback: boolean): boolean =>
	v === undefined ? fallback : v.toLowerCase() === 'true'

const num = (v: string | undefined, fallback: number): number => {
	const n = v === undefined ? NaN : Number(v)
	return Number.isFinite(n) ? n : fallback
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const config = {
	liveMode: bool(env.VITE_LIVE_MODE, false),
	triggerUrl: env.VITE_TRIGGER_URL || '/api/trigger',
	triggerAuth: env.VITE_TRIGGER_AUTH || '',
	resultUrl: env.VITE_RESULT_URL || '',
	enclavePublicKey:
		env.VITE_ENCLAVE_PUBLIC_KEY ||
		'0x375128744ecd24947690752d5fc2f80b48133372874dd28b16afbd5e610ff90b',
	demoTarget: env.VITE_DEMO_TARGET || ZERO_ADDRESS,
	demoNetwork: env.VITE_DEMO_NETWORK || 'eth-sepolia',
	demoToken: env.VITE_DEMO_TOKEN || 'native',
	demoCalldata: env.VITE_DEMO_CALLDATA || '0x9e5faafc',
	escrowAddress: (env.VITE_ESCROW_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
	chainId: num(env.VITE_CHAIN_ID, 11155111),
	chainRpcUrl: env.VITE_CHAIN_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
} as const

export const isEscrowConfigured = (): boolean =>
	config.escrowAddress.toLowerCase() !== ZERO_ADDRESS
