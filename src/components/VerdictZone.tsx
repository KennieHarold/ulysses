import { useState, type CSSProperties } from 'react'
import { formatEth, severityMeta, truncateHash, weiToEth } from '../lib/format'
import type { Verdict } from '../lib/verdict'

const CopyButton = ({ value }: { value: string }) => {
	const [copied, setCopied] = useState(false)
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
			setTimeout(() => setCopied(false), 1400)
		} catch {
			return
		}
	}
	return (
		<button className={`copy${copied ? ' copied' : ''}`} onClick={copy} aria-label="copy full hash">
			{copied ? '✓ copied' : 'copy'}
		</button>
	)
}

export const VerdictZone = ({ verdict, source }: { verdict: Verdict | null; source: string }) => {
	if (!verdict) {
		return (
			<section className="zone verdict" aria-labelledby="verdict-h">
				<span className="zone-num">03 / verdict</span>
				<h2 id="verdict-h">Verdict</h2>
				<p className="sub">The only value the enclave lets back out.</p>
				<div className="empty">Awaiting the verdict from the enclave…</div>
			</section>
		)
	}

	const meta = severityMeta(verdict.severity)
	const sevStyle = {
		'--sev-color': meta.color,
		'--sev-glow': meta.glow,
	} as CSSProperties

	return (
		<section className="zone verdict" aria-labelledby="verdict-h">
			<span className="zone-num">03 / verdict</span>
			<h2 id="verdict-h">Verdict</h2>
			<p className="sub">
				The only value the enclave lets back out — computed on the decrypted exploit.
			</p>

			<div className="verdict-card">
				<div className="sev" style={sevStyle} data-severity={verdict.severity}>
					<span className="ring" aria-hidden />
					<div className="sev-text">
						<div className="lbl">{meta.label}</div>
						<div className="desc">{meta.blurb}</div>
					</div>
				</div>

				{verdict.error && (
					<div
						className="verdict-error"
						role="alert"
						style={{
							margin: '0 0 14px',
							padding: '10px 12px',
							borderRadius: 8,
							border: '1px solid var(--warn, #b8860b)',
							background: 'rgba(184, 134, 11, 0.08)',
							fontSize: 13,
							lineHeight: 1.4,
						}}
					>
						<b>Simulation unavailable.</b> The verdict below is not a confirmed result — the enclave
						could not run the simulation: {verdict.error}
					</div>
				)}

				<div className="verdict-grid">
					<div className="vfield">
						<div className="vlabel">vault loss</div>
						<div className="vvalue">{formatEth(verdict.lossAmount)}</div>
						<div className="vsecond">{verdict.lossAmount} wei</div>
					</div>
					<div className="vfield">
						<div className="vlabel">target function</div>
						<div className="vvalue">{verdict.targetFunction}</div>
						<div className="vsecond">
							{verdict.network ? `replayed on ${verdict.network}` : 'replayed on a fork'}
						</div>
					</div>
					{verdict.target && (
						<div className="vfield" style={{ gridColumn: '1 / -1' }}>
							<div className="vlabel">target contract</div>
							<div className="vvalue hash-value">
								<span title={verdict.target}>{truncateHash(verdict.target, 14, 12)}</span>
							</div>
							<div className="vsecond">the address the decrypted exploit was simulated against</div>
						</div>
					)}
					<div className="vfield" style={{ gridColumn: '1 / -1' }}>
						<div className="vlabel">exploit hash · keccak256(calldata)</div>
						<div className="vvalue hash-value">
							<span title={verdict.exploitHash}>{truncateHash(verdict.exploitHash, 14, 12)}</span>
							<CopyButton value={verdict.exploitHash} />
						</div>
						<div className="vsecond">commits to the exact exploit without revealing it</div>
					</div>
				</div>

				<div className="verdict-caption">
					<span className="lock" aria-hidden>
						🔐
					</span>
					<span>
						Computed inside the TEE — the exploit was never read outside it. Loss{' '}
						<b>{weiToEth(verdict.lossAmount)} ETH</b> measured by replaying the decrypted calldata
						on a fork. <span style={{ color: 'var(--muted-2)' }}>verdict source: {source}</span>
					</span>
				</div>
			</div>
		</section>
	)
}
