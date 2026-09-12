export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export interface Verdict {
	severity: Severity
	lossAmount: string
	targetFunction: string
	exploitHash: string
	target?: string
	network?: string
}

const SEVERITIES: readonly Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']

const isSeverity = (v: unknown): v is Severity =>
	typeof v === 'string' && (SEVERITIES as readonly string[]).includes(v)

export const parseVerdict = (value: unknown): Verdict | null => {
	const candidates: unknown[] = []
	const v = value as Record<string, unknown> | null
	if (v && typeof v === 'object') {
		candidates.push(v)
		if (v.verdict) candidates.push(v.verdict)
		if (v.result) {
			candidates.push(v.result)
			const r = v.result as Record<string, unknown>
			if (r && typeof r === 'object' && r.verdict) candidates.push(r.verdict)
		}
	}

	for (const c of candidates) {
		if (!c || typeof c !== 'object') continue
		const o = c as Record<string, unknown>
		if (isSeverity(o.severity) && typeof o.exploitHash === 'string') {
			return {
				severity: o.severity,
				lossAmount: String(o.lossAmount ?? '0'),
				targetFunction: typeof o.targetFunction === 'string' ? o.targetFunction : 'unknown',
				exploitHash: o.exploitHash,
				...(typeof o.target === 'string' ? { target: o.target } : {}),
				...(typeof o.network === 'string' ? { network: o.network } : {}),
			}
		}
	}
	return null
}

export const parseExecutionAck = (
	value: unknown,
): { executionId: string; status: string } | null => {
	const result = (value as { result?: Record<string, unknown> } | null)?.result
	if (!result || typeof result !== 'object') return null
	const id = result.workflow_execution_id ?? result.workflowExecutionId
	if (typeof id !== 'string') return null
	return { executionId: id, status: typeof result.status === 'string' ? result.status : 'ACCEPTED' }
}
