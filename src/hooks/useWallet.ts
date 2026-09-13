import { useCallback, useEffect, useState } from 'react'
import { getAddress, numberToHex, type Address } from 'viem'
import { config } from '../lib/config'
import { getInjectedProvider } from '../lib/chain'

interface WalletState {
	address: Address | null
	chainId: number | null
	connecting: boolean
	error: string | null
	hasProvider: boolean
	onWrongChain: boolean
	connect: () => Promise<void>
	disconnect: () => void
	switchChain: () => Promise<void>
}

const parseChainId = (raw: unknown): number | null => {
	if (typeof raw === 'string') return Number.parseInt(raw, 16)
	if (typeof raw === 'number') return raw
	return null
}

export const useWallet = (): WalletState => {
	const provider = getInjectedProvider()
	const [address, setAddress] = useState<Address | null>(null)
	const [chainId, setChainId] = useState<number | null>(null)
	const [connecting, setConnecting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!provider) return
		let cancelled = false

		provider
			.request({ method: 'eth_accounts' })
			.then((accounts) => {
				if (cancelled) return
				const list = accounts as string[]
				if (list.length > 0) setAddress(getAddress(list[0]))
			})
			.catch(() => undefined)

		provider
			.request({ method: 'eth_chainId' })
			.then((id) => {
				if (!cancelled) setChainId(parseChainId(id))
			})
			.catch(() => undefined)

		const onAccounts = (accounts: unknown) => {
			const list = accounts as string[]
			setAddress(list.length > 0 ? getAddress(list[0]) : null)
		}
		const onChain = (id: unknown) => setChainId(parseChainId(id))

		provider.on('accountsChanged', onAccounts)
		provider.on('chainChanged', onChain)
		return () => {
			cancelled = true
			provider.removeListener('accountsChanged', onAccounts)
			provider.removeListener('chainChanged', onChain)
		}
	}, [provider])

	const connect = useCallback(async () => {
		if (!provider) {
			setError('No injected wallet found. Install a browser wallet to continue.')
			return
		}
		setConnecting(true)
		setError(null)
		try {
			const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
			if (accounts.length > 0) setAddress(getAddress(accounts[0]))
			const id = await provider.request({ method: 'eth_chainId' })
			setChainId(parseChainId(id))
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err))
		} finally {
			setConnecting(false)
		}
	}, [provider])

	const disconnect = useCallback(() => {
		setAddress(null)
	}, [])

	const switchChain = useCallback(async () => {
		if (!provider) return
		try {
			await provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: numberToHex(config.chainId) }],
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err))
		}
	}, [provider])

	return {
		address,
		chainId,
		connecting,
		error,
		hasProvider: provider !== null,
		onWrongChain: address !== null && chainId !== null && chainId !== config.chainId,
		connect,
		disconnect,
		switchChain,
	}
}
