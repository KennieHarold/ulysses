import { useState, type CSSProperties } from 'react'
import { formatEth, severityMeta, truncateHash, weiToEth } from '../lib/format'
import type { Verdict } from '../lib/verdict'
import { Rosette } from './Guilloche'
import { Icon } from './Icon'
import { markOf } from '../lib/pipeline'

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
		<button
			className={`copy${copied ? ' copied' : ''}`}
			onClick={copy}
			aria-label="copy full hash"
		>
			<Icon name={copied ? 'check' : 'copy'} size={11} strokeWidth={1.8} />
			{copied ? 'copied' : 'copy'}
		</button>
	)
}

export const VerdictZone = ({ verdict, source }: { verdict: Verdict | null; source: string }) => {
	if (!verdict) {
		return (
			<section className="clause" aria-labelledby="verdict-h">
				<div className="clause-head">
					<span className="clause-mark">{markOf('Verdict')}</span>
					<h2 id="verdict-h">Verdict</h2>
				</div>
				<p className="sub">The one and only value the enclave lets back out.</p>
				<div className="empty">
					<Icon name="seal" size={26} className="empty-mark" strokeWidth={1.2} />
					No verdict issued yet.
				</div>
			</section>
		)
	}

	const meta = severityMeta(verdict.severity)
	const voided = Boolean(verdict.error)
	const sevStyle = {
		'--sev-color': voided ? '#5d6b62' : meta.color,
		'--sev-wash': voided ? 'transparent' : meta.wash,
	} as CSSProperties

	return (
		<section className="clause" aria-labelledby="verdict-h">
			<div className="clause-head">
				<span className="clause-mark">{markOf('Verdict')}</span>
				<h2 id="verdict-h">Verdict</h2>
			</div>
			<p className="sub">
				The one and only value the enclave lets back out, measured on the decrypted exploit and
				signed inside the box.
			</p>

			<div className="verdict-card">
				<div
					className={`sev${voided ? ' voided' : ''}`}
					style={sevStyle}
					data-severity={verdict.severity}
				>
					<span className="ring">
						<Rosette seed={verdict.exploitHash} size={104} strokeWidth={0.55} />
					</span>
					<div className="sev-text">
						<div className="lbl">{meta.label}</div>
						<div className="desc">{meta.blurb}</div>
					</div>
					<span className="sev-stamp">
						{voided
							? 'Void · simulation failed'
							: verdict.signature
								? 'Signed · bearer voucher'
								: 'Unsigned'}
					</span>
				</div>

				{verdict.error && (
					<div className="verdict-warn" role="alert">
						<Icon name="alert" size={17} className="mark" />
						<span>
							<b>The simulation could not be run, so this verdict is void.</b> Nothing below is a
							confirmed result and no reward was signed. Submit the exploit again once the
							simulation backend is reachable.
							<span className="detail">{verdict.error}</span>
						</span>
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
						<div className="vfield wide">
							<div className="vlabel">target contract</div>
							<div className="vvalue hash-value">
								<span title={verdict.target}>{truncateHash(verdict.target, 14, 12)}</span>
							</div>
							<div className="vsecond">the address the decrypted exploit was replayed against</div>
						</div>
					)}
					<div className="vfield wide">
						<div className="vlabel">exploit hash · keccak256(calldata)</div>
						<div className="vvalue hash-value">
							<span title={verdict.exploitHash}>{truncateHash(verdict.exploitHash, 14, 12)}</span>
							<CopyButton value={verdict.exploitHash} />
						</div>
						<div className="vsecond">
							Commits to this exact exploit without revealing a byte of it, and seeds the rosette
							above, so no two verdicts carry the same seal.
						</div>
					</div>
				</div>

				<div className="verdict-caption">
					<Icon name="seal" size={17} className="mark" />
					<span>
						Computed inside the TEE, on calldata that was never read outside it. The{' '}
						<b>{weiToEth(verdict.lossAmount)} ETH</b> loss was measured by replaying the decrypted
						exploit against a fork. <span className="src">Source: {source}.</span>
					</span>
				</div>
			</div>
		</section>
	)
}
