import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SubmitZone, type ExploitForm } from '../components/SubmitZone'
import { WireZone } from '../components/WireZone'
import { AdjudicateZone } from '../components/AdjudicateZone'
import { VerdictZone } from '../components/VerdictZone'
import { StatusBar } from '../components/StatusBar'
import { ClaimButton } from '../components/ClaimButton'
import { Rosette } from '../components/Guilloche'
import { Coupons } from '../components/Coupons'
import { Icon } from '../components/Icon'
import { getProgram, type Program } from '../lib/escrow'
import { config } from '../lib/config'
import { markOf } from '../lib/pipeline'
import { ethAmount, serialOf, truncateHash } from '../lib/format'
import { isClaimable } from '../lib/verdict'
import { useWallet } from '../hooks/useWallet'
import { useExploitSubmit } from '../hooks/useExploitSubmit'

export const ProgramDetail = () => {
	const { id } = useParams<{ id: string }>()
	const { address } = useWallet()
	const [program, setProgram] = useState<Program | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)

	const [form, setForm] = useState<ExploitForm>({
		to: '',
		network: config.demoNetwork,
		token: config.demoToken,
		from: '',
		value: '0',
		calldata: config.demoCalldata,
	})

	const { status, ciphertext, envelope, verdict, error, busy, submit } = useExploitSubmit()

	useEffect(() => {
		if (id === undefined) return
		getProgram(BigInt(id))
			.then((p) => {
				setProgram(p)
				if (p) setForm((f) => ({ ...f, to: p.target }))
			})
			.catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
	}, [id])

	const updateForm = useCallback((patch: Partial<ExploitForm>) => {
		setForm((f) => ({ ...f, ...patch }))
	}, [])

	const onSubmit = useCallback(() => {
		void submit({ ...form, researcher: address ?? undefined, programId: id })
	}, [submit, form, address, id])

	const verdictSource = config.liveMode ? 'live workflow' : 'captured run'

	return (
		<div className="sheet">
			<div className="sheet-body">
				<Rosette seed={`program-${id}`} size={260} className="watermark" strokeWidth={0.5} />

				<Link to="/register" className="backlink">
					<Icon name="arrow" size={13} />
					All programs
				</Link>

				<div className="sheet-head">
					<div>
						<h1 className="sheet-title">Program №{id}</h1>
						<p className="lede">
							Fill in the request, and it is sealed here in your browser before it goes anywhere.
							What comes back is a severity, a measured loss, and a signature. <b>That is all anyone
							ever learns</b> about what you found.
						</p>
					</div>
					<dl className="issue-block">
						<dt>Network</dt>
						<dd>{config.demoNetwork}</dd>
						<dt>Serial</dt>
						<dd>{program ? serialOf(id ?? '0', program.target) : '\u2014'}</dd>
						<dt>Verdicts</dt>
						<dd className={config.liveMode ? 'live' : undefined}>
							{config.liveMode ? 'live workflow' : 'captured run'}
						</dd>
					</dl>
				</div>

				{loadError && (
					<div className="errbox" role="alert">
						<Icon name="alert" size={18} className="mark" />
						<div>
							<div className="et">Cannot load this program</div>
							<div className="em">
								The escrow could not be read. Check that the network above matches your wallet, then
								reload the page.
								<span className="detail">{loadError}</span>
							</div>
						</div>
					</div>
				)}

				{program && (
					<>
						<dl className="pool">
							<div>
								<dt>Target contract</dt>
								<dd title={program.target}>{truncateHash(program.target, 18, 14)}</dd>
							</div>
							<div className="pool-sum">
								<dt>In the pool</dt>
								<dd>
									{ethAmount(program.balance.toString())}
									<span className="unit">ETH</span>
								</dd>
							</div>
						</dl>

						<div className="strip-label">Reward per severity</div>
						<Coupons program={program} />

						<p className="payee">
							{address ? (
								<>
									The reward pays out to <b>{truncateHash(address, 6, 4)}</b>, the wallet you have
									connected right now.
								</>
							) : (
								<>
									The reward pays out to the wallet you connect. Connect the one you want paid before
									you submit.
								</>
							)}
						</p>
					</>
				)}

				<div className="rail-gap">
					<StatusBar status={status} />
				</div>

				{error && (
					<div className="errbox" role="alert">
						<Icon name="alert" size={18} className="mark" />
						<div>
							<div className="et">
								{status === 'error' && !ciphertext ? 'Sealing failed' : 'Relay failed'}
							</div>
							<div className="em">
								{status === 'error' && !ciphertext
									? 'Your exploit was not sent anywhere. Check the calldata is valid hex, then submit again.'
									: 'The sealed bytes did not reach the workflow. Nothing was disclosed. Submit again in a moment.'}
								<span className="detail">{error}</span>
							</div>
							<button className="ghost retry" onClick={onSubmit} disabled={busy}>
								<Icon name="arrow" size={13} />
								Submit again
							</button>
						</div>
					</div>
				)}

				<SubmitZone
					form={form}
					onChange={updateForm}
					enclavePublicKey={config.enclavePublicKey}
					onSubmit={onSubmit}
					busy={busy}
				/>

				<WireZone ciphertext={ciphertext} envelope={envelope} />

				<AdjudicateZone status={status} verdict={verdict} network={form.network} />

				<VerdictZone verdict={verdict} source={verdictSource} />

				{verdict && (
					<section className="clause" aria-labelledby="claim-h">
						<div className="clause-head">
							<span className="clause-mark">{markOf('Redeem')}</span>
							<h2 id="claim-h">Redeem</h2>
						</div>
						{isClaimable(verdict) ? (
							<>
								<p className="sub">
									The enclave signed this verdict against program #{verdict.programId}. That
									signature is bearer: present it to the escrow and the {verdict.severity} coupon pays
									out of the pool.
								</p>
								<ClaimButton verdict={verdict} />
							</>
						) : (
							<p className="sub">
								{verdict.severity === 'NONE'
									? 'The replay moved nothing out of the vault, so there is nothing to redeem.'
									: verdict.error
										? 'The simulation never ran, so the enclave signed no reward.'
										: 'This verdict came back unsigned. Configure the escrow and attestor to enable payouts.'}
							</p>
						)}
					</section>
				)}
			</div>

			<footer className="colophon">
				<span>Chain {config.chainId}</span>
				<span className="sep">·</span>
				<span>Enclave {truncateHash(config.enclavePublicKey, 8, 6)}</span>
				<span className="sep">·</span>
				<span>Plaintext never leaves this page</span>
			</footer>
		</div>
	)
}
