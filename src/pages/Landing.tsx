import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { listPrograms, type Program } from '../lib/escrow'
import { isEscrowConfigured, config } from '../lib/config'
import { ethAmount, severityMeta, truncateHash, weiToEth } from '../lib/format'
import { Rosette } from '../components/Guilloche'
import { Icon } from '../components/Icon'
import captured from '../fixtures/captured-verdict.json'

const EXCHANGE = [
	{
		name: 'Seal',
		keepLabel: 'stays with you',
		keep: 'The plaintext calldata, in this tab. It is encrypted to the enclave key before a single byte leaves the page.',
		outLabel: 'goes out',
		out: <code>361 opaque bytes</code>,
	},
	{
		name: 'Relay',
		keepLabel: 'stays with you',
		keep: 'Nothing changes hands. The DON is a courier carrying a sealed envelope it has no key to.',
		outLabel: 'every node operator sees',
		out: <>The same opaque bytes, and no way to open them.</>,
	},
	{
		name: 'Adjudicate',
		keepLabel: 'stays with you',
		keep: 'Still only you hold the exploit. The enclave opens it, replays it on a fork, measures the drain, and forgets it.',
		outLabel: 'never leaves the box',
		out: <>The decrypted calldata. It is read once, inside the enclave, and never re-published.</>,
	},
	{
		name: 'Verdict',
		keepLabel: 'stays with you',
		keep: 'Everything about how the drain actually works. The verdict describes the damage, not the method.',
		outLabel: 'comes back out',
		out: <>A severity, a measured loss, and a commitment hash. Nothing else.</>,
	},
	{
		name: 'Redeem',
		keepLabel: 'stays with you',
		keep: 'The exploit, still unpublished, still yours to disclose on your own terms, or never.',
		outLabel: 'the sponsor gets',
		out: <>A bill they paid without ever reading what they paid for.</>,
	},
] as const

const FEATURES = [
	{
		t: 'A seal drawn by the exploit itself',
		d: 'The rosette is a guilloché generated from keccak256(calldata). Change one byte of the exploit and the whole engraving changes. It cannot be transferred to another verdict.',
	},
	{
		t: 'A severity that was measured, not argued',
		d: 'The tier comes from replaying the decrypted exploit against a fork of the named network and reading the vault balance, not from a triage call.',
	},
	{
		t: 'A commitment without a disclosure',
		d: 'The hash proves this verdict belongs to one exact exploit, while revealing nothing about what it does.',
	},
	{
		t: 'Bearer, and signed inside the box',
		d: 'The attestor signature is produced in the enclave. Present it to the escrow and it pays the tier. No approval step stands in between.',
	},
] as const

export const Landing = () => {
	const [programs, setPrograms] = useState<Program[] | null>(null)

	useEffect(() => {
		if (!isEscrowConfigured()) return
		listPrograms()
			.then(setPrograms)
			.catch(() => setPrograms(null))
	}, [])

	const meta = severityMeta('HIGH')
	const sevStyle = { '--sev-color': meta.color, '--sev-wash': meta.wash } as CSSProperties
	const escrowed = programs?.reduce((sum, p) => sum + p.balance, 0n)

	return (
		<div className="sheet">
			<div className="sheet-body">
				<Rosette seed="ulysses-landing" size={260} className="watermark" strokeWidth={0.5} />
				<div className="leaf">
					<aside className="leaf-stub">
						<div className="stub-caption">
							<span className="stub-label">Retained by you</span>
						</div>
						<span className="stub-title">The exploit</span>
						<div className="stub-keep">
							<span className="stub-keep-label">plaintext calldata</span>
							<code>{config.demoCalldata}</code>
						</div>
						<Rosette seed="retained-stub" size={104} className="stub-seal" strokeWidth={0.5} />
						<span className="stub-note">
							Readable here, in this tab, and nowhere else. Never transmitted in the clear, never
							stored, never read by the sponsor paying for it.
						</span>
					</aside>

					<div className="leaf-face">
						<h1 className="sheet-title">
							Get paid for the drain. <em>Never hand it over.</em>
						</h1>
						<p className="lede">
							Every bug bounty asks you to give up the exploit first and trust the payout second.
							Ulysses inverts it. You seal the exploit in your browser, a sealed enclave replays it
							and prices the damage, and the only thing that ever comes back out is a signed verdict.{' '}
							<b>That verdict is the money.</b>
						</p>
						<div className="hero-actions">
							<Link className="primary" to="/register">
								<Icon name="ledger" size={14} />
								Browse open programs
							</Link>
							<Link className="ghost" to="/sponsor">
								<Icon name="deposit" size={14} />
								Sponsor a program
							</Link>
						</div>
						<div className="hero-scheme">
							X25519 · HKDF-SHA256 · XChaCha20-Poly1305 · keccak256 commitment · Chainlink CRE
						</div>
					</div>
				</div>
			</div>

			<div className="sheet-body leaf-next">
				<section className="clause">
					<div className="clause-head">
						<h2>What you keep, and what actually leaves</h2>
					</div>
					<p className="sub">
						Five steps, and in every one of them the exploit stays on your side of the perforation.
						This is the whole product; the rest is plumbing.
					</p>

					<div className="xhead" aria-hidden="true">
						<span />
						<span>Your side of the perforation</span>
						<span>What the world receives</span>
					</div>
					<div className="exchange">
						{EXCHANGE.map((row, i) => (
							<div className="xrow" key={row.name}>
								<div className="xrow-mark">{i + 1}</div>
								<dl className="xcell">
									<div className="xname">{row.name}</div>
									<dt>{row.keepLabel}</dt>
									<dd>{row.keep}</dd>
								</dl>
								<dl className="xcell">
									<dt>{row.outLabel}</dt>
									<dd>{row.out}</dd>
								</dl>
							</div>
						))}
					</div>
				</section>
			</div>

			<div className="sheet-body leaf-next">
				<section className="clause">
					<div className="clause-head">
						<h2>How to read a verdict</h2>
					</div>
					<p className="sub">
						A real captured verdict, reproduced here as a specimen. Four things make it worth money,
						and none of them require anyone to see the exploit.
					</p>

					<div className="specimen-grid">
						<div className="specimen" style={sevStyle}>
							<span className="specimen-stamp">Specimen</span>
							<div className="specimen-head">
								<span className="marker head-marker">1</span>
								<Rosette seed={captured.exploitHash} size={86} strokeWidth={0.55} />
								<div>
									<div className="lbl">{captured.severity}</div>
									<div className="vsecond">{meta.blurb}</div>
								</div>
							</div>
							<div className="specimen-row">
								<span className="sk">
									<span className="marker">2</span>vault loss
								</span>
								<span className="sv">{weiToEth(captured.lossAmount)} ETH</span>
							</div>
							<div className="specimen-row">
								<span className="sk">target function</span>
								<span className="sv">{captured.targetFunction}</span>
							</div>
							<div className="specimen-row">
								<span className="sk">replayed on</span>
								<span className="sv">{captured.network}</span>
							</div>
							<div className="specimen-row">
								<span className="sk">
									<span className="marker">3</span>exploit hash
								</span>
								<span className="sv">{truncateHash(captured.exploitHash, 10, 8)}</span>
							</div>
							<div className="specimen-row">
								<span className="sk">
									<span className="marker">4</span>attestor signature
								</span>
								<span className="sv">signed in enclave</span>
							</div>
						</div>

						<ol className="feature-list">
							{FEATURES.map((f, i) => (
								<li key={f.t}>
									<span className="marker">{i + 1}</span>
									<div>
										<div className="ft">{f.t}</div>
										<div className="fd">{f.d}</div>
									</div>
								</li>
							))}
						</ol>
					</div>
				</section>
			</div>

			<div className="sheet-body leaf-next">
				<section className="clause">
					<div className="clause-head">
						<h2>If you are the one being drained</h2>
					</div>
					<p className="sub">
						Escrow ETH against your own contract and fix what each severity is worth, in advance. A
						researcher redeems their tier straight from the pool. You pay for a drain you never have
						to receive, hold, or sit on, and the price was public before anyone went looking.
					</p>

					<div className="closing">
						<div className="closing-fig">
							{programs && programs.length > 0 && escrowed !== undefined ? (
								<>
									{programs.length} open {programs.length === 1 ? 'program' : 'programs'},{' '}
									<span>{ethAmount(escrowed.toString())} ETH</span> escrowed on{' '}
									{config.demoNetwork}.
								</>
							) : (
								<>Open a program and set the price.</>
							)}
						</div>
						<div className="hero-actions flush">
							<Link className="primary" to="/sponsor">
								<Icon name="deposit" size={14} />
								Sponsor a program
							</Link>
							<Link className="ghost" to="/register">
								<Icon name="arrow" size={14} />
								See the register
							</Link>
						</div>
					</div>
				</section>
			</div>

			<footer className="colophon">
				<span>Chain {config.chainId}</span>
				<span className="sep">·</span>
				<span>Enclave {truncateHash(config.enclavePublicKey, 8, 6)}</span>
				<span className="sep">·</span>
				<span>Specimen verdict from a captured run</span>
			</footer>
		</div>
	)
}
