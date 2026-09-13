import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseEther, type Hex } from 'viem'
import { createProgram } from '../lib/escrow'
import { publicClient } from '../lib/chain'
import { isEscrowConfigured, config } from '../lib/config'
import { useWallet } from '../hooks/useWallet'
import { Rosette } from '../components/Guilloche'
import { Icon } from '../components/Icon'

const DEFAULTS = { low: '0.1', medium: '0.5', high: '2', critical: '10', funding: '12' }

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const hasRealTarget = (v: string): boolean => {
	const t = v.trim()
	return /^0x[0-9a-fA-F]{40}$/.test(t) && t.toLowerCase() !== ZERO_ADDRESS
}

const TIER_LABEL = {
	low: 'low reward',
	medium: 'medium reward',
	high: 'high reward',
	critical: 'critical reward',
} as const

export const CreateProgram = () => {
	const navigate = useNavigate()
	const { address, onWrongChain } = useWallet()
	const [target, setTarget] = useState(
		hasRealTarget(config.demoTarget) ? config.demoTarget : '',
	)
	const [tiers, setTiers] = useState(DEFAULTS)
	const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
	const [txHash, setTxHash] = useState<Hex | null>(null)
	const [error, setError] = useState<string | null>(null)

	const set = (patch: Partial<typeof tiers>) => setTiers((t) => ({ ...t, ...patch }))

	const submit = async () => {
		setStatus('submitting')
		setError(null)
		try {
			const rewards = [
				0n,
				parseEther(tiers.low || '0'),
				parseEther(tiers.medium || '0'),
				parseEther(tiers.high || '0'),
				parseEther(tiers.critical || '0'),
			] as const
			const hash = await createProgram(target.trim() as Hex, rewards, parseEther(tiers.funding || '0'))
			setTxHash(hash)
			await publicClient.waitForTransactionReceipt({ hash })
			setStatus('done')
			setTimeout(() => navigate('/register'), 1200)
		} catch (err) {
			setStatus('error')
			setError(err instanceof Error ? err.message : String(err))
		}
	}

	return (
		<div className="sheet">
			<div className="sheet-body">
				<Rosette seed="ulysses-sponsor" size={260} className="watermark" strokeWidth={0.5} />

				<div className="sheet-head">
					<div>
						<h1 className="sheet-title">
							Post a price <em>before anyone finds it.</em>
						</h1>
						<p className="lede">
							Escrow ETH against your own contract and fix what each severity is worth. A researcher
							with a signed verdict redeems their tier straight from this pool. No report lands in
							your inbox, and <b>you never receive an exploit you then have to sit on.</b>
						</p>
					</div>
					<dl className="issue-block">
						<dt>Network</dt>
						<dd>{config.demoNetwork}</dd>
						<dt>Chain</dt>
						<dd>{config.chainId}</dd>
					</dl>
				</div>

				{!isEscrowConfigured() && (
					<div className="errbox" role="alert">
						<Icon name="alert" size={18} className="mark" />
						<div>
							<div className="et">No escrow configured</div>
							<div className="em">Set VITE_ESCROW_ADDRESS to a deployed BountyEscrow.</div>
						</div>
					</div>
				)}

				<section className="clause" aria-labelledby="sponsor-h">
					<div className="clause-head">
						<h2 id="sponsor-h">New program</h2>
					</div>
					<p className="sub">
						Initial funding is what the pool can actually pay out today. Tier prices are fixed on
						chain at creation, so a researcher knows what a CRITICAL is worth before they spend a
						week looking for one.
					</p>

					<div className="field-wide" style={{ marginTop: 0 }}>
						<label className="field-label" htmlFor="target">
							target contract
						</label>
						<input
							id="target"
							className="field-input"
							spellCheck={false}
							value={target}
							onChange={(e) => setTarget(e.target.value)}
							placeholder="0x… the contract you are covering"
							aria-describedby="target-hint"
						/>
						{target.trim().length > 0 && !hasRealTarget(target) && (
							<p className="field-error" id="target-hint">
								That is not a fundable contract address. Paste the 20-byte address of the contract you
								are covering.
							</p>
						)}
					</div>

					<div className="field-grid" style={{ marginTop: 26 }}>
						{(['critical', 'high', 'medium', 'low'] as const).map((k) => (
							<div className="field" key={k}>
								<label className="field-label" htmlFor={k}>
									{TIER_LABEL[k]} in ETH
								</label>
								<input
									id={k}
									className="field-input"
									spellCheck={false}
									inputMode="decimal"
									value={tiers[k]}
									onChange={(e) => set({ [k]: e.target.value })}
								/>
							</div>
						))}
						<div className="field">
							<label className="field-label" htmlFor="funding">
								initial funding in ETH
							</label>
							<input
								id="funding"
								className="field-input"
								spellCheck={false}
								inputMode="decimal"
								value={tiers.funding}
								onChange={(e) => set({ funding: e.target.value })}
							/>
						</div>
					</div>

					<div className="actions">
						<button
							className="primary"
							onClick={submit}
							disabled={
								status === 'submitting' ||
								!address ||
								onWrongChain ||
								!isEscrowConfigured() ||
								!hasRealTarget(target)
							}
						>
							{status === 'submitting' ? (
								<>
									<Icon name="spinner" size={14} strokeWidth={2} className="spin" />
									Submitting…
								</>
							) : (
								<>
									<Icon name="deposit" size={14} />
									Create and fund
								</>
							)}
						</button>
						{!hasRealTarget(target) && (
							<span className="hint">Name the contract you are covering.</span>
						)}
						{hasRealTarget(target) && !address && (
							<span className="hint">Connect a wallet to sponsor a program.</span>
						)}
						{onWrongChain && <span className="hint">Switch to the escrow network first.</span>}
						{status === 'done' && (
							<span className="hint ok">
								<Icon name="check" size={13} strokeWidth={2} />
								Created. Taking you to the register
							</span>
						)}
					</div>

					{txHash && (
						<p className="tx-line">
							Transaction <code>{txHash.slice(0, 14)}…</code>
						</p>
					)}
					{error && (
						<div className="errbox" role="alert" style={{ marginTop: 18, marginBottom: 0 }}>
							<Icon name="alert" size={18} className="mark" />
							<div>
								<div className="et">Could not create the program</div>
								<div className="em">{error}</div>
							</div>
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
