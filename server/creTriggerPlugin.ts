import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir, homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import type { Connect, Plugin } from 'vite'

const PROXY_PATH = '/api/trigger'

const SIM_RESULT_MARKER = 'Workflow Simulation Result:'
const LOCAL_SIM_TIMEOUT_MS = 120_000

const isTruthy = (v: string | undefined): boolean =>
	v !== undefined && ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())

interface LocalSimConfig {
	bin: string
	projectRoot: string
	workflowDir: string
	target: string
	envFile: string
}

const parseVerdictJson = (stdout: string): unknown => {
	const marker = stdout.indexOf(SIM_RESULT_MARKER)
	if (marker === -1) return null
	const rest = stdout.slice(marker + SIM_RESULT_MARKER.length)
	const start = rest.indexOf('{')
	if (start === -1) return null

	let depth = 0
	for (let i = start; i < rest.length; i++) {
		const ch = rest[i]
		if (ch === '{') depth++
		else if (ch === '}') {
			depth--
			if (depth === 0) {
				try {
					return JSON.parse(rest.slice(start, i + 1))
				} catch {
					return null
				}
			}
		}
	}
	return null
}

const runLocalSimulation = (
	ciphertext: string,
	cfg: LocalSimConfig,
): Promise<{ status: number; body: unknown }> =>
	new Promise((resolvePromise) => {
		const dir = mkdtempSync(join(tmpdir(), 'cre-trigger-'))
		const payloadPath = join(dir, `${randomUUID()}.json`)
		writeFileSync(payloadPath, JSON.stringify({ exploitCiphertext: ciphertext }))

		const args = [
			'workflow',
			'simulate',
			cfg.workflowDir,
			'-T',
			cfg.target,
			'-e',
			cfg.envFile,
			'--http-payload',
			payloadPath,
		]

		const child = spawn(cfg.bin, args, { cwd: cfg.projectRoot })
		let stdout = ''
		let stderr = ''
		child.stdout.on('data', (d) => (stdout += d))
		child.stderr.on('data', (d) => (stderr += d))

		const timer = setTimeout(() => child.kill('SIGKILL'), LOCAL_SIM_TIMEOUT_MS)

		const finish = (status: number, body: unknown) => {
			clearTimeout(timer)
			rmSync(dir, { recursive: true, force: true })
			resolvePromise({ status, body })
		}

		child.on('error', (err) => {
			finish(502, {
				error: 'local simulation could not start',
				detail:
					`${err.message}. Is the cre CLI at "${cfg.bin}"? ` +
					`Set CRE_BIN to its path if not.`,
			})
		})

		child.on('close', (code) => {
			const verdict = parseVerdictJson(stdout)
			if (verdict) return finish(200, verdict)
			finish(502, {
				error: 'local simulation produced no verdict',
				detail: (stderr || stdout).trim().slice(-1500) || `cre exited with code ${code}`,
			})
		})
	})

const base64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url')

const canonicalJson = (value: unknown): string => {
	if (Array.isArray(value)) {
		return `[${value.map(canonicalJson).join(',')}]`
	}
	if (value && typeof value === 'object') {
		const keys = Object.keys(value as Record<string, unknown>).sort()
		return `{${keys
			.map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
			.join(',')}}`
	}
	return JSON.stringify(value)
}

const readBody = (req: IncomingMessage): Promise<string> =>
	new Promise((resolve, reject) => {
		let data = ''
		req.on('data', (chunk) => {
			data += chunk
			if (data.length > 1_000_000) reject(new Error('request body too large'))
		})
		req.on('end', () => resolve(data))
		req.on('error', reject)
	})

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
	res.statusCode = status
	res.setHeader('Content-Type', 'application/json')
	res.end(JSON.stringify(body))
}

const signCreJwt = async (
	requestBody: unknown,
	signerPrivateKey: `0x${string}`,
): Promise<string> => {
	const account = privateKeyToAccount(signerPrivateKey)

	const digest = `0x${createHash('sha256').update(canonicalJson(requestBody), 'utf8').digest('hex')}`

	const now = Math.floor(Date.now() / 1000)
	const header = { alg: 'ETH', typ: 'JWT' }
	const payload = {
		digest,
		iss: account.address,
		iat: now,
		exp: now + 300,
		jti: crypto.randomUUID(),
	}

	const message = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
	const signatureHex = await account.signMessage({ message })
	const signature = base64url(Buffer.from(signatureHex.slice(2), 'hex'))

	return `${message}.${signature}`
}

export const creTriggerPlugin = (env: Record<string, string>): Plugin => {
	const gatewayUrl = env.CRE_GATEWAY_URL
	const workflowId = env.CRE_WORKFLOW_ID
	const signerKey = env.CRE_SIGNER_PRIVATE_KEY as `0x${string}` | undefined

	const localSimulate = isTruthy(env.CRE_LOCAL_SIMULATE)
	const localCfg: LocalSimConfig = {
		bin: env.CRE_BIN || join(homedir(), '.cre', 'bin', 'cre'),
		projectRoot: resolve(process.cwd(), env.CRE_LOCAL_PROJECT_ROOT || 'cre'),
		workflowDir: env.CRE_LOCAL_WORKFLOW_DIR || 'exploit-verifier',
		target: env.CRE_LOCAL_TARGET || 'local-simulation',
		envFile: env.CRE_LOCAL_ENV_FILE || '.env',
	}

	const handler: Connect.NextHandleFunction = async (req, res, next) => {
		if (!req.url || !req.url.startsWith(PROXY_PATH)) return next()
		if (req.method !== 'POST') {
			return sendJson(res, 405, { error: 'method not allowed; use POST' })
		}

		if (!localSimulate && (!gatewayUrl || !workflowId || !signerKey)) {
			return sendJson(res, 501, {
				error: 'live trigger proxy not configured',
				detail:
					'Set CRE_GATEWAY_URL, CRE_WORKFLOW_ID and CRE_SIGNER_PRIVATE_KEY for cloud live mode, ' +
					'or set CRE_LOCAL_SIMULATE=true to run the local cre simulator (dev only).',
			})
		}

		try {
			const raw = await readBody(req)
			const incoming = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
			if (typeof incoming.exploitCiphertext !== 'string') {
				return sendJson(res, 400, { error: 'body must include a string "exploitCiphertext"' })
			}

			if (localSimulate) {
				const { status, body } = await runLocalSimulation(incoming.exploitCiphertext, localCfg)
				return sendJson(res, status, body)
			}

			const rpcBody = {
				id: crypto.randomUUID(),
				jsonrpc: '2.0',
				method: 'workflows.execute',
				params: {
					input: { exploitCiphertext: incoming.exploitCiphertext },
					workflow: { workflowID: workflowId },
				},
			}

			const token = await signCreJwt(rpcBody, signerKey as `0x${string}`)

			const upstream = await fetch(gatewayUrl as string, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(rpcBody),
			})

			const text = await upstream.text()
			res.statusCode = upstream.status
			res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
			res.end(text)
		} catch (err) {
			sendJson(res, 502, {
				error: 'trigger proxy failed',
				detail: err instanceof Error ? err.message : String(err),
			})
		}
	}

	return {
		name: 'cre-trigger-proxy',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(handler)
		},
		configurePreviewServer(server) {
			server.middlewares.use(handler)
		},
	}
}
