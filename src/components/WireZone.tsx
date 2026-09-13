import type { EnvelopeParts } from '../lib/seal'
import { truncateHash } from '../lib/format'
import { Icon } from './Icon'
import { markOf } from '../lib/pipeline'

interface Props {
	ciphertext: string | null
	envelope: EnvelopeParts | null
}

export const WireZone = ({ ciphertext, envelope }: Props) => (
	<section className="clause" aria-labelledby="wire-h">
		<div className="clause-head">
			<span className="clause-mark">{markOf('Relay')}</span>
			<h2 id="wire-h">Relay</h2>
		</div>
		<p className="sub">
			This is everything anyone else sees. These are the exact bytes that travel to the DON and pass
			through every node operator on the way. No key rides along with them, so there is nothing here
			to read and nothing here to steal.
		</p>

		{ciphertext ? (
			<>
				<div className="pantograph-wrap">
					<div className="pantograph" aria-label="sealed exploit ciphertext">
						{ciphertext}
					</div>
					<span className="overprint">Sealed</span>
				</div>

				{envelope && (
					<>
						<dl className="cipher-meta">
							<div className="m">
								<dt>on the wire</dt>
								<dd>{envelope.totalBytes} bytes</dd>
							</div>
							<div className="m">
								<dt>scheme</dt>
								<dd>X25519 · HKDF-SHA256 · XChaCha20-Poly1305</dd>
							</div>
							<div className="m">
								<dt>envelope version</dt>
								<dd>0x0{envelope.version}</dd>
							</div>
						</dl>

						<div className="envelope">
							<div className="env-row">
								<span className="en-name">ephemeral pubkey</span>
								<span className="en-val" title={envelope.ephemeralPublicKey}>
									{truncateHash(envelope.ephemeralPublicKey, 20, 12)}
								</span>
							</div>
							<div className="env-row">
								<span className="en-name">nonce · 24 bytes</span>
								<span className="en-val" title={envelope.nonce}>
									{truncateHash(envelope.nonce, 20, 12)}
								</span>
							</div>
							<div className="env-row">
								<span className="en-name">ciphertext</span>
								<span className="en-val">{envelope.ciphertext.length / 2 - 1} bytes, opaque</span>
							</div>
							<div className="env-row">
								<span className="en-name">poly1305 tag</span>
								<span className="en-val" title={envelope.authTag}>
									{truncateHash(envelope.authTag, 12, 10)}
								</span>
							</div>
						</div>
					</>
				)}

				<div className="readback">
					<Icon name="eyeOff" size={17} className="mark" />
					<span>
						<b>Try to read it from out here and you get exactly this.</b> Opening the envelope needs
						the X25519 private key, and that key never leaves the enclave. Operators can relay these
						bytes all day; they cannot open them.
					</span>
				</div>
			</>
		) : (
			<div className="empty">
				<Icon name="lock" size={26} className="empty-mark" strokeWidth={1.2} />
				Submit an exploit above and the sealed bytes will appear here.
			</div>
		)}
	</section>
)
