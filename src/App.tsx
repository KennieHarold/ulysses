import { useCallback, useState } from 'react'
import { SubmitZone, type ExploitForm } from './components/SubmitZone'
import { WireZone } from './components/WireZone'
import { VerdictZone } from './components/VerdictZone'
import { StatusBar, type Status } from './components/StatusBar'
import { config } from './lib/config'
import { devLog } from './lib/devlog'
import {
	describeEnvelope,
	sealExploitRequest,
	type EnvelopeParts,
	type ExploitRequest,
} from './lib/seal'
import { triggerLive } from './lib/trigger'
import { parseVerdict, type Verdict } from './lib/verdict'
import capturedVerdict from './fixtures/captured-verdict.json'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function App() {
	const [form, setForm] = useState<ExploitForm>({
		to: config.demoTarget,
		network: config.demoNetwork,
		token: config.demoToken,
		from: '',
		value: '0',
		calldata: config.demoCalldata,
	})
	const [status, setStatus] = useState<Status>('idle')
	const [ciphertext, setCiphertext] = useState<string | null>(null)
	const [envelope, setEnvelope] = useState<EnvelopeParts | null>(null)
	const [verdict, setVerdict] = useState<Verdict | null>(null)
	const [error, setError] = useState<string | null>(null)

	const updateForm = useCallback((patch: Partial<ExploitForm>) => {
		setForm((f) => ({ ...f, ...patch }))
	}, [])

	const busy = status === 'encrypting' || status === 'triggering' || status === 'awaiting'
	const verdictSource = config.liveMode ? 'live workflow' : 'captured run (fixture)'

	const handleSubmit = useCallback(async () => {
		setError(null)
		setVerdict(null)
		setCiphertext(null)
		setEnvelope(null)
		setStatus('encrypting')

		let sealed: string
		try {
			const request: ExploitRequest = {
				to: form.to.trim(),
				network: form.network.trim(),
				calldata: form.calldata.trim(),
			}
			if (form.from.trim()) request.from = form.from.trim()
			if (form.value.trim()) request.value = form.value.trim()
			if (form.token.trim()) request.token = form.token.trim()

			if (import.meta.env.DEV) devLog('sealing exploit request', request)
			sealed = sealExploitRequest(request, config.enclavePublicKey)
			setCiphertext(sealed)
			setEnvelope(describeEnvelope(sealed))
			if (import.meta.env.DEV) devLog('sealed envelope', sealed)
		} catch (err) {
			setStatus('error')
			setError(
				`Encryption failed: ${err instanceof Error ? err.message : String(err)}. ` +
					'Check that the addresses and calldata are valid hex and the enclave public key is 32 bytes.',
			)
			return
		}

		try {
			let result: Verdict | null
			if (config.liveMode) {
				setStatus('triggering')
				await sleep(250)
				setStatus('awaiting')
				result = await triggerLive(sealed)
			} else {
				setStatus('triggering')
				await sleep(400)
				setStatus('awaiting')
				await sleep(600)
				result = parseVerdict(capturedVerdict)
			}

			if (!result) throw new Error('no verdict returned')
			setVerdict(result)
			setStatus('done')
		} catch (err) {
			setStatus('error')
			setError(err instanceof Error ? err.message : String(err))
		}
	}, [form])

	return (
		<div className="app">
			<header className="header">
				<span className={`mode-badge ${config.liveMode ? 'live' : 'fixture'}`}>
					{config.liveMode ? '● LIVE — deployed workflow' : '● FIXTURE — captured verdict'}
				</span>
				<span className="eyebrow">🔐 Chainlink CRE · Confidential Workflow</span>
				<h1>
					The exploit is priced <span className="accent">without ever being read.</span>
				</h1>
				<p className="lede">
					Encrypt an exploit in your browser, hand the ciphertext to a TEE workflow, and get back
					only a verdict — severity and vault loss. The payload is decrypted, replayed, and scored
					entirely inside the enclave. Node operators relay bytes they can never open.
				</p>
			</header>

			<StatusBar status={status} />

			{error && (
				<div className="errbox" role="alert">
					<div className="et">
						⚠ {status === 'error' && !ciphertext ? 'Encryption error' : 'Trigger error'}
					</div>
					<div className="em">{error}</div>
				</div>
			)}

			<SubmitZone
				form={form}
				onChange={updateForm}
				enclavePublicKey={config.enclavePublicKey}
				onSubmit={handleSubmit}
				busy={busy}
			/>

			<WireZone ciphertext={ciphertext} envelope={envelope} />

			<VerdictZone verdict={verdict} source={verdictSource} />

			<footer className="foot">
				Confidentiality boundary: the plaintext exploit and the enclave private key live only inside
				the TEE. What crosses out is the <code>Verdict</code>. In fixture mode the verdict is loaded
				from <code>src/fixtures/captured-verdict.json</code>; in live mode it comes from the
				deployed workflow via <code>{config.triggerUrl}</code>.
			</footer>
		</div>
	)
}
