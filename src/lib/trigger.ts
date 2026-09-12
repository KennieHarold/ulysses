import { config } from './config'
import { devLog } from './devlog'
import { parseExecutionAck, parseVerdict, type Verdict } from './verdict'

export class TriggerError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const pollForVerdict = async (executionId: string): Promise<Verdict> => {
	const attempts = 30
	const intervalMs = 2000
	const url = new URL(config.resultUrl, window.location.origin)
	url.searchParams.set('executionId', executionId)

	for (let i = 0; i < attempts; i++) {
		await sleep(intervalMs)
		const res = await fetch(url.toString(), {
			headers: config.triggerAuth ? { Authorization: `Bearer ${config.triggerAuth}` } : undefined,
		})
		if (!res.ok) continue
		const body = await res.json().catch(() => null)
		const verdict = parseVerdict(body)
		if (verdict) return verdict
	}
	throw new TriggerError(
		`No verdict after ${(attempts * intervalMs) / 1000}s polling for execution ${executionId}.`,
	)
}

export const triggerLive = async (exploitCiphertext: string): Promise<Verdict> => {
	const res = await fetch(config.triggerUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(config.triggerAuth ? { Authorization: `Bearer ${config.triggerAuth}` } : {}),
		},
		body: JSON.stringify({ exploitCiphertext }),
	})

	const body = await res.json().catch(() => null)
	devLog('trigger response', res.status, body)

	if (!res.ok) {
		const detail =
			(body && (body.detail || body.error)) || `trigger failed with status ${res.status}`
		throw new TriggerError(String(detail))
	}

	const verdict = parseVerdict(body)
	if (verdict) return verdict

	const ack = parseExecutionAck(body)
	if (ack) {
		if (config.resultUrl) return pollForVerdict(ack.executionId)
		throw new TriggerError(
			`Workflow accepted (execution ${ack.executionId}, status ${ack.status}), but CRE's HTTP ` +
				`trigger is asynchronous and no VITE_RESULT_URL is configured to poll for the verdict. ` +
				`View it in the CRE UI, or set VITE_RESULT_URL.`,
		)
	}

	throw new TriggerError('Trigger response did not contain a recognizable verdict.')
}
