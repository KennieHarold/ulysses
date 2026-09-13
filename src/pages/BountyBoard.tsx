import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPrograms, type Program } from '../lib/escrow'
import { isEscrowConfigured, config } from '../lib/config'
import { ethAmount, serialOf, truncateHash } from '../lib/format'
import { Band, Rosette } from '../components/Guilloche'
import { Coupons } from '../components/Coupons'
import { Icon } from '../components/Icon'

export const BountyBoard = () => {
	const [programs, setPrograms] = useState<Program[] | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!isEscrowConfigured()) {
			setError('No escrow is configured. Set VITE_ESCROW_ADDRESS to a deployed BountyEscrow.')
			return
		}
		listPrograms()
			.then(setPrograms)
			.catch((err) => setError(err instanceof Error ? err.message : String(err)))
	}, [])

	return (
		<div className="sheet">
			<div className="sheet-body">
				<Rosette seed="ulysses-register" size={260} className="watermark" strokeWidth={0.5} />

				<div className="sheet-head">
					<div>
						<h1 className="sheet-title">
							The register of <em>open programs.</em>
						</h1>
						<p className="lede">
							Every funded pool currently open on {config.demoNetwork}, with its tier prices fixed on
							chain. Pick a target you can drain, and submit against it.
						</p>
					</div>
					<dl className="issue-block">
						<dt>Network</dt>
						<dd>{config.demoNetwork}</dd>
						<dt>Escrow</dt>
						<dd>
							{isEscrowConfigured() ? truncateHash(config.escrowAddress, 6, 4) : 'not configured'}
						</dd>
						<dt>Verdicts</dt>
						<dd className={config.liveMode ? 'live' : undefined}>
							{config.liveMode ? 'live workflow' : 'captured run'}
						</dd>
					</dl>
				</div>

				<section className="clause" aria-labelledby="register-h">
					<h2 id="register-h" className="visually-hidden">
						Open programs
					</h2>

					{error && (
						<div className="errbox" role="alert">
							<Icon name="alert" size={18} className="mark" />
							<div>
								<div className="et">Cannot load programs</div>
								<div className="em">{error}</div>
							</div>
						</div>
					)}

					{!error && programs === null && (
						<div className="empty">
							<Icon name="spinner" size={26} className="empty-mark spin" strokeWidth={1.2} />
							Reading the escrow…
						</div>
					)}

					{programs !== null && programs.length === 0 && (
						<div className="empty">
							<Icon name="ledger" size={26} className="empty-mark" strokeWidth={1.2} />
							Nothing funded yet. <Link to="/sponsor">Open the first program</Link>
						</div>
					)}

					{programs !== null && programs.length > 0 && (
						<div className="register">
							{programs.map((p) => (
								<Link key={p.id.toString()} to={`/programs/${p.id}`} className="cert">
									<div className="counterfoil">
										<span className="foil-label">Program</span>
										<span className="foil-no">№{p.id.toString()}</span>
										<span className="foil-serial">{serialOf(p.id.toString(), p.target)}</span>
										<span className="foil-net">{config.demoNetwork}</span>
									</div>
									<div className="cert-face">
										<div className="cert-top">
											<dl className="cert-target">
												<dt>Target contract</dt>
												<dd title={p.target}>{truncateHash(p.target, 14, 12)}</dd>
											</dl>
											<div className="cert-sum">
												<div className="amount">
													{ethAmount(p.balance.toString())}
													<span className="unit">ETH</span>
												</div>
												<div className="caption">In the pool</div>
											</div>
										</div>
										<span className="cert-band">
											<Band seed={p.target} height={26} />
										</span>
										<div className="cert-foot">
											<Coupons program={p} />
											<span className="cert-cta">
												Submit an exploit
												<Icon name="arrow" size={13} />
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>

			<footer className="colophon">
				<span>Chain {config.chainId}</span>
				<span className="sep">·</span>
				<span>Enclave {truncateHash(config.enclavePublicKey, 8, 6)}</span>
				<span className="sep">·</span>
				<span>X25519 · HKDF-SHA256 · XChaCha20-Poly1305</span>
			</footer>
		</div>
	)
}
