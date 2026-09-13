import { useEffect, useState } from 'react'
import type { Hex } from 'viem'
import { claimReward, isClaimed } from '../lib/escrow'
import { publicClient } from '../lib/chain'
import { useWallet } from '../hooks/useWallet'
import type { Verdict } from '../lib/verdict'
import { isClaimable } from '../lib/verdict'
import { Icon } from './Icon'

type ClaimState = 'idle' | 'claiming' | 'claimed' | 'error'

export const ClaimButton = ({ verdict, onClaimed }: { verdict: Verdict; onClaimed?: () => void }) => {
	const { address, onWrongChain } = useWallet()
	const [state, setState] = useState<ClaimState>('idle')
	const [txHash, setTxHash] = useState<Hex | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [alreadyClaimed, setAlreadyClaimed] = useState<boolean | null>(null)

	useEffect(() => {
		let cancelled = false
		if (verdict.programId === undefined) return
		isClaimed(BigInt(verdict.programId), verdict.exploitHash as Hex)
			.then((claimed) => {
				if (!cancelled) setAlreadyClaimed(claimed)
			})
			.catch(() => {
				if (!cancelled) setAlreadyClaimed(null)
			})
		return () => {
			cancelled = true
		}
	}, [verdict.programId, verdict.exploitHash])

	if (!isClaimable(verdict)) {
		return <span className="claim-note">No signed reward attached to this verdict.</span>
	}

	if (alreadyClaimed === null && state === 'idle' && verdict.programId !== undefined) {
		return (
			<span className="claim-note">
				<Icon name="spinner" size={13} strokeWidth={2} className="spin" /> Checking whether this
				coupon has already been redeemed…
			</span>
		)
	}

	if (state === 'claimed' || alreadyClaimed) {
		return (
			<span className="claim-note claimed">
				<Icon name="check" size={13} strokeWidth={2} />
				Reward paid out
				{txHash && <code>{txHash.slice(0, 10)}…</code>}
			</span>
		)
	}

	const mismatch =
		address !== null &&
		verdict.researcher !== undefined &&
		address.toLowerCase() !== verdict.researcher.toLowerCase()

	const blockedBy = !address
		? 'claim-no-wallet'
		: onWrongChain
			? 'claim-wrong-chain'
			: mismatch
				? 'claim-mismatch'
				: undefined

	const claim = async () => {
		setState('claiming')
		setError(null)
		try {
			const hash = await claimReward(verdict)
			setTxHash(hash)
			await publicClient.waitForTransactionReceipt({ hash })
			setState('claimed')
			onClaimed?.()
		} catch (err) {
			setState('error')
			setError(err instanceof Error ? err.message : String(err))
		}
	}

	return (
		<div className="claim-row">
			<button
				className="primary"
				onClick={claim}
				disabled={state === 'claiming' || !address || onWrongChain || mismatch}
				aria-describedby={blockedBy}
			>
				{state === 'claiming' ? (
					<>
						<Icon name="spinner" size={14} strokeWidth={2} className="spin" />
						Claiming…
					</>
				) : (
					<>
						<Icon name="coupon" size={14} />
						Redeem this coupon
					</>
				)}
			</button>
			{!address && (
				<span className="claim-note" id="claim-no-wallet">
					Connect the payout wallet to redeem.
				</span>
			)}
			{onWrongChain && (
				<span className="claim-note" id="claim-wrong-chain">
					Switch to the escrow network to redeem.
				</span>
			)}
			{mismatch && (
				<span className="claim-note" id="claim-mismatch">
					This coupon pays {verdict.researcher?.slice(0, 8)}…, so connect that wallet to redeem it.
				</span>
			)}
			{error && (
				<span className="claim-note error" role="alert">
					The redemption did not go through and nothing was spent. Check the wallet, then try again.
					<span className="detail">{error}</span>
				</span>
			)}
		</div>
	)
}
