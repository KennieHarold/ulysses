import type { Verdict } from './verdict'

export interface Voucher {
	verdict: Verdict
	programId: string
	researcher: string
	createdAt: number
}

const KEY = 'exploit-escrow/vouchers/v1'

const read = (): Voucher[] => {
	try {
		const raw = localStorage.getItem(KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? (parsed as Voucher[]) : []
	} catch {
		return []
	}
}

const write = (vouchers: Voucher[]): void => {
	try {
		localStorage.setItem(KEY, JSON.stringify(vouchers))
	} catch {
		return
	}
}

const keyOf = (v: Voucher): string =>
	`${v.programId}:${v.verdict.exploitHash}:${v.researcher.toLowerCase()}`

export const listVouchers = (): Voucher[] =>
	read().sort((a, b) => b.createdAt - a.createdAt)

export const listVouchersFor = (researcher: string): Voucher[] =>
	listVouchers().filter((v) => v.researcher.toLowerCase() === researcher.toLowerCase())

export const saveVoucher = (verdict: Verdict): Voucher | null => {
	if (verdict.programId === undefined || !verdict.researcher) return null
	const voucher: Voucher = {
		verdict,
		programId: verdict.programId,
		researcher: verdict.researcher,
		createdAt: Date.now(),
	}
	const existing = read().filter((v) => keyOf(v) !== keyOf(voucher))
	existing.push(voucher)
	write(existing)
	return voucher
}
