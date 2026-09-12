export {
	sealExploit,
	openExploit,
	sealExploitRequest,
	openExploitRequest,
} from '../../cre/exploit-verifier/sealed-box'
export type { ExploitRequest } from '../../cre/exploit-verifier/sealed-box'

const VERSION = 0x01
const EPK_LEN = 32
const NONCE_LEN = 24
const TAG_LEN = 16

export interface EnvelopeParts {
	version: number
	ephemeralPublicKey: string
	nonce: string
	ciphertext: string
	authTag: string
	totalBytes: number
}

const stripHex = (s: string): string => (/^0x/i.test(s) ? s.slice(2) : s)

export const describeEnvelope = (envelopeHex: string): EnvelopeParts => {
	const hex = stripHex(envelopeHex)
	const bytes = hex.length / 2
	const hx = (startByte: number, lenBytes: number): string =>
		`0x${hex.slice(startByte * 2, (startByte + lenBytes) * 2)}`

	const ctStart = 1 + EPK_LEN + NONCE_LEN
	const ctLen = Math.max(0, bytes - ctStart - TAG_LEN)

	return {
		version: parseInt(hex.slice(0, 2) || '0', 16) || VERSION,
		ephemeralPublicKey: hx(1, EPK_LEN),
		nonce: hx(1 + EPK_LEN, NONCE_LEN),
		ciphertext: hx(ctStart, ctLen),
		authTag: hx(bytes - TAG_LEN, TAG_LEN),
		totalBytes: bytes,
	}
}
