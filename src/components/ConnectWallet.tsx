import { useWallet } from '../hooks/useWallet'
import { truncateHash } from '../lib/format'
import { Icon } from './Icon'

export const ConnectWallet = () => {
	const { address, connecting, error, hasProvider, onWrongChain, connect, disconnect, switchChain } =
		useWallet()

	if (!hasProvider) {
		return (
			<span className="wallet-group">
				<span className="wallet-pill wallet-missing" title="No injected wallet detected">
					<Icon name="wallet" size={14} />
					No wallet
				</span>
			</span>
		)
	}

	if (!address) {
		return (
			<span className="wallet-group">
				<button className="wallet-btn" onClick={connect} disabled={connecting}>
					{connecting ? 'Connecting…' : 'Connect wallet'}
				</button>
			</span>
		)
	}

	return (
		<span className="wallet-group">
			{onWrongChain && (
				<button className="wallet-btn warn" onClick={switchChain} title={error ?? undefined}>
					Switch network
				</button>
			)}
			<button className="wallet-pill" onClick={disconnect} title="Click to disconnect">
				<Icon name="wallet" size={14} />
				{truncateHash(address, 6, 4)}
			</button>
		</span>
	)
}
