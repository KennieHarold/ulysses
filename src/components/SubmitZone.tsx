import { truncateHash } from '../lib/format'
import { Icon } from './Icon'
import { markOf } from '../lib/pipeline'

export interface ExploitForm {
	to: string
	network: string
	token: string
	from: string
	value: string
	calldata: string
}

interface Props {
	form: ExploitForm
	onChange: (patch: Partial<ExploitForm>) => void
	enclavePublicKey: string
	onSubmit: () => void
	busy: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const canSubmit = (f: ExploitForm): boolean =>
	f.to.trim().length > 0 && f.network.trim().length > 0 && f.calldata.trim().length > 0

export const SubmitZone = ({ form, onChange, enclavePublicKey, onSubmit, busy }: Props) => (
	<section className="clause" aria-labelledby="submit-h">
		<div className="clause-head">
			<span className="clause-mark">{markOf('Seal')}</span>
			<h2 id="submit-h">Seal</h2>
		</div>
		<p className="sub">
			Name the contract you can drain and paste the calldata that drains it. Everything below is
			sealed <b>in this browser</b>, to the enclave's public key, before a single byte leaves the
			page. Nobody downstream can open it, and that is the whole point.
		</p>

		<div className="field-grid">
			<div className="field">
				<label className="field-label" htmlFor="to">
					target contract
				</label>
				<input
					id="to"
					className="field-input"
					spellCheck={false}
					value={form.to}
					onChange={(e) => onChange({ to: e.target.value })}
					placeholder="0x…"
				/>
			</div>
			<div className="field">
				<label className="field-label" htmlFor="network">
					network
				</label>
				<input
					id="network"
					className="field-input"
					spellCheck={false}
					value={form.network}
					onChange={(e) => onChange({ network: e.target.value })}
					placeholder="eth-sepolia"
				/>
			</div>
			<div className="field">
				<label className="field-label" htmlFor="token">
					token the loss is measured in
				</label>
				<input
					id="token"
					className="field-input"
					spellCheck={false}
					value={form.token}
					onChange={(e) => onChange({ token: e.target.value })}
					placeholder="native, or an 0x… ERC-20"
				/>
			</div>
			<div className="field">
				<label className="field-label" htmlFor="from">
					sender (optional)
				</label>
				<input
					id="from"
					className="field-input"
					spellCheck={false}
					value={form.from}
					onChange={(e) => onChange({ from: e.target.value })}
					placeholder="0x… (defaults to 0x00…00)"
				/>
			</div>
			<div className="field">
				<label className="field-label" htmlFor="value">
					value in wei (optional)
				</label>
				<input
					id="value"
					className="field-input"
					spellCheck={false}
					value={form.value}
					onChange={(e) => onChange({ value: e.target.value })}
					placeholder="0"
				/>
			</div>
		</div>

		<div className="field-wide">
			<label className="field-label" htmlFor="calldata">
				exploit calldata, plaintext hex
			</label>
			<textarea
				id="calldata"
				className="calldata"
				spellCheck={false}
				value={form.calldata}
				onChange={(e) => onChange({ calldata: e.target.value })}
				placeholder="0x…"
			/>
		</div>

		<div className="pubkey-row">
			<Icon name="key" size={17} className="mark" />
			<span className="k">
				Sealed to enclave key <b title={enclavePublicKey}>{truncateHash(enclavePublicKey, 12, 10)}</b>{' '}
				using X25519 key agreement. The enclave holds the only private half, and it is read-only: it
				can open your request but never re-publish it.
			</span>
		</div>

		<div className="actions">
			<button className="primary" onClick={onSubmit} disabled={busy || !canSubmit(form)}>
				{busy ? (
					<>
						<Icon name="spinner" size={14} strokeWidth={2} className="spin" />
						Working…
					</>
				) : (
					<>
						<Icon name="lock" size={14} />
						Submit exploit
					</>
				)}
			</button>
			<span className="hint">Seal it, relay it, and wait for the verdict.</span>
		</div>
	</section>
)
