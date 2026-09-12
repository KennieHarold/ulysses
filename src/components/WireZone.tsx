import type { EnvelopeParts } from '../lib/seal'
import { truncateHash } from '../lib/format'

interface Props {
	ciphertext: string | null
	envelope: EnvelopeParts | null
}

export const WireZone = ({ ciphertext, envelope }: Props) => (
	<section className="zone wire" aria-labelledby="wire-h">
		<span className="zone-num">02 / wire</span>
		<span className="wire-tag">🛰 what the network &amp; node operators see</span>
		<h2 id="wire-h">Ciphertext on the wire</h2>
		<p className="sub">
			This opaque blob is exactly what travels to the DON and runs past every node operator. It is
			unreadable outside the enclave: no private key here, no plaintext, nothing to steal.
		</p>

		{ciphertext ? (
			<>
				<div className="cipher" aria-label="sealed exploit ciphertext">
					{ciphertext}
				</div>
				{envelope && (
					<>
						<div className="cipher-meta">
							<span className="m">
								total <b>{envelope.totalBytes} bytes</b>
							</span>
							<span className="m">
								scheme <b>X25519 · HKDF-SHA256 · XChaCha20-Poly1305</b>
							</span>
							<span className="m">
								version <b>0x0{envelope.version}</b>
							</span>
						</div>
						<div className="envelope">
							<div className="env-row">
								<span className="en-name">ephemeral pubkey</span>
								<span className="en-val" title={envelope.ephemeralPublicKey}>
									{truncateHash(envelope.ephemeralPublicKey, 20, 12)}
								</span>
							</div>
							<div className="env-row">
								<span className="en-name">nonce (24B)</span>
								<span className="en-val" title={envelope.nonce}>
									{truncateHash(envelope.nonce, 20, 12)}
								</span>
							</div>
							<div className="env-row">
								<span className="en-name">ciphertext</span>
								<span className="en-val">{envelope.ciphertext.length / 2 - 1} bytes (opaque)</span>
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
					<b>Read attempt outside the enclave:</b> 🔒 decryption requires the enclave-held X25519
					private key. Operators can relay these bytes but can never open them.
				</div>
			</>
		) : (
			<div className="empty">Submit an exploit to see the sealed bytes that go over the wire.</div>
		)}
	</section>
)
