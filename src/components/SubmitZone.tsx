import { truncateHash } from '../lib/format'

interface Props {
	calldata: string
	onCalldata: (v: string) => void
	enclavePublicKey: string
	onSubmit: () => void
	busy: boolean
}

export const SubmitZone = ({ calldata, onCalldata, enclavePublicKey, onSubmit, busy }: Props) => (
	<section className="zone" aria-labelledby="submit-h">
		<span className="zone-num">01 / submit</span>
		<h2 id="submit-h">Exploit calldata</h2>
		<p className="sub">
			Paste the raw exploit calldata. It is encrypted <b>in your browser</b> to the enclave's public
			key before anything leaves this page — the plaintext never touches the network.
		</p>

		<label className="field-label" htmlFor="calldata">
			plaintext calldata (hex)
		</label>
		<textarea
			id="calldata"
			className="calldata"
			spellCheck={false}
			value={calldata}
			onChange={(e) => onCalldata(e.target.value)}
			placeholder="0x…"
		/>

		<div className="pubkey-row">
			<span className="lock" aria-hidden>
				🔒
			</span>
			<span className="k">
				encrypting to enclave pubkey{' '}
				<b title={enclavePublicKey}>{truncateHash(enclavePublicKey, 12, 10)}</b> · X25519 ·
				read-only
			</span>
		</div>

		<div className="actions">
			<button className="primary" onClick={onSubmit} disabled={busy || !calldata.trim()}>
				{busy ? 'Working…' : 'Submit exploit'}
			</button>
			<span className="hint">seal → trigger → verdict</span>
		</div>
	</section>
)
