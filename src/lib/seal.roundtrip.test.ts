import { describe, expect, it } from 'vitest'
import { bytesToHex } from '@noble/ciphers/utils.js'
import { x25519 } from '@noble/curves/ed25519.js'
import { describeEnvelope, sealExploit, sealExploitRequest, type ExploitRequest } from './seal'
import { openExploit, openExploitRequest } from '../../cre/exploit-verifier/sealed-box'

const ENCLAVE_PRIV = `0x${bytesToHex(x25519.utils.randomSecretKey())}`
const ENCLAVE_PUB = `0x${bytesToHex(x25519.getPublicKey(ENCLAVE_PRIV.slice(2)))}`

describe('shared seal module: browser ciphertext decrypts in the enclave', () => {
	it('round-trips: browser sealExploit to handler openExploit equals the original plaintext', () => {
		const calldata = '0x9e5faafc'
		const sealed = sealExploit(calldata, ENCLAVE_PUB)
		expect(openExploit(sealed, ENCLAVE_PRIV)).toBe(calldata)
	})

	it('round-trips a longer, realistic calldata payload', () => {
		const calldata = '0x2e1a7d4d00000000000000000000000000000000000000000000000000000000000003e8'
		const sealed = sealExploit(calldata, ENCLAVE_PUB)
		expect(openExploit(sealed, ENCLAVE_PRIV)).toBe(calldata)
	})

	it('produces a fresh envelope on every call', () => {
		const a = sealExploit('0x9e5faafc', ENCLAVE_PUB)
		const b = sealExploit('0x9e5faafc', ENCLAVE_PUB)
		expect(a).not.toBe(b)
		expect(openExploit(a, ENCLAVE_PRIV)).toBe(openExploit(b, ENCLAVE_PRIV))
	})

	it('rejects the wrong private key', () => {
		const otherPriv = `0x${bytesToHex(x25519.utils.randomSecretKey())}`
		const sealed = sealExploit('0x9e5faafc', ENCLAVE_PUB)
		expect(() => openExploit(sealed, otherPriv)).toThrow()
	})

	it('reports the on-wire layout: version, 32B epk, 24B nonce, 16B tag', () => {
		const sealed = sealExploit('0x9e5faafc', ENCLAVE_PUB)
		const parts = describeEnvelope(sealed)
		expect(parts.version).toBe(1)
		expect(parts.ephemeralPublicKey.slice(2)).toHaveLength(64)
		expect(parts.nonce.slice(2)).toHaveLength(48)
		expect(parts.authTag.slice(2)).toHaveLength(32)
		expect(parts.totalBytes).toBe(sealed.slice(2).length / 2)
	})
})

describe('shared seal module: the target travels inside the sealed request', () => {
	const request: ExploitRequest = {
		to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
		network: 'eth-sepolia',
		calldata: '0x9e5faafc',
		from: '0x0000000000000000000000000000000000000001',
		value: '1000000000000000000',
		token: 'native',
	}

	it('round-trips: a browser-sealed request decrypts in the enclave to the same object', () => {
		const sealed = sealExploitRequest(request, ENCLAVE_PUB)
		expect(openExploitRequest(sealed, ENCLAVE_PRIV)).toEqual(request)
	})

	it('keeps the target contract/chain confidential — not present in the envelope bytes', () => {
		const sealed = sealExploitRequest(request, ENCLAVE_PUB)
		expect(sealed.toLowerCase()).not.toContain(request.to.slice(2).toLowerCase())
		expect(sealed).not.toContain('sepolia')
	})

	it('rejects the wrong private key for a sealed request', () => {
		const otherPriv = `0x${bytesToHex(x25519.utils.randomSecretKey())}`
		const sealed = sealExploitRequest(request, ENCLAVE_PUB)
		expect(() => openExploitRequest(sealed, otherPriv)).toThrow()
	})
})
