import { createPublicClient, createWalletClient, custom, defineChain, http, type EIP1193Provider } from 'viem'
import { config } from './config'

export const activeChain = defineChain({
	id: config.chainId,
	name: `chain-${config.chainId}`,
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: [config.chainRpcUrl] } },
})

export const publicClient = createPublicClient({
	chain: activeChain,
	transport: http(config.chainRpcUrl),
})

export const getInjectedProvider = (): EIP1193Provider | null => {
	if (typeof window === 'undefined') return null
	const provider = (window as unknown as { ethereum?: EIP1193Provider }).ethereum
	return provider ?? null
}

export const getWalletClient = () => {
	const provider = getInjectedProvider()
	if (!provider) throw new Error('No injected wallet found. Install a browser wallet to continue.')
	return createWalletClient({ chain: activeChain, transport: custom(provider) })
}
