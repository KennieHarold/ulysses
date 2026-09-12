import { truncateHash } from '../lib/format'

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

export const canSubmit = (f: ExploitForm): boolean =>
	f.to.trim().length > 0 && f.network.trim().length > 0 && f.calldata.trim().length > 0

export const SubmitZone = ({ form, onChange, enclavePublicKey, onSubmit, busy }: Props) => (
	<section className="zone" aria-labelledby="submit-h">
		<span className="zone-num">01 / submit</span>
		<h2 id="submit-h">Exploit request</h2>
		<p className="sub">
			Name the target contract and chain, then paste the raw exploit calldata. The whole request is
			encrypted <b>in your browser</b> to the enclave's public key before anything leaves this page;
			the plaintext never touches the network.
		</p>

		<div className="target-grid">
			<div>
				<label className="field-label" htmlFor="to">
					target contract (to)
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
			<div>
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
			<div>
				<label className="field-label" htmlFor="token">
					token (loss measured in)
				</label>
				<input
					id="token"
					className="field-input"
					spellCheck={false}
					value={form.token}
					onChange={(e) => onChange({ token: e.target.value })}
					placeholder="native or 0x… ERC20"
				/>
			</div>
			<div>
				<label className="field-label" htmlFor="from">
					sender (from · optional)
				</label>
				<input
					id="from"
					className="field-input"
					spellCheck={false}
					value={form.from}
					onChange={(e) => onChange({ from: e.target.value })}
					placeholder="0x… (default 0x00…00)"
				/>
			</div>
			<div>
				<label className="field-label" htmlFor="value">
					value wei (optional)
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

		<label className="field-label" htmlFor="calldata" style={{ marginTop: 16 }}>
			plaintext calldata (hex)
		</label>
		<textarea
			id="calldata"
			className="calldata"
			spellCheck={false}
			value={form.calldata}
			onChange={(e) => onChange({ calldata: e.target.value })}
			placeholder="0x…"
		/>

		<div className="pubkey-row">
			<span className="lock" aria-hidden>
				🔒
			</span>
			<span className="k">
				encrypting target + calldata to enclave pubkey{' '}
				<b title={enclavePublicKey}>{truncateHash(enclavePublicKey, 12, 10)}</b> · X25519 ·
				read-only
			</span>
		</div>

		<div className="actions">
			<button className="primary" onClick={onSubmit} disabled={busy || !canSubmit(form)}>
				{busy ? 'Working…' : 'Submit exploit'}
			</button>
			<span className="hint">seal → trigger → verdict</span>
		</div>
	</section>
)
