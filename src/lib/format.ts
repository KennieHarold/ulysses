import type { Severity } from './verdict'

export const weiToEth = (wei: string): string => {
	let neg = false
	let s = (wei ?? '0').trim()
	if (s.startsWith('-')) {
		neg = true
		s = s.slice(1)
	}
	if (!/^\d+$/.test(s)) return '0'
	s = s.replace(/^0+(?=\d)/, '')
	const padded = s.padStart(19, '0')
	const intPart = padded.slice(0, -18)
	const frac = padded.slice(-18).replace(/0+$/, '')
	const whole = frac.length ? `${intPart}.${frac}` : intPart
	return neg ? `-${whole}` : whole
}

export const withThousands = (num: string): string => {
	const [int, frac] = num.split('.')
	const sign = int.startsWith('-') ? '-' : ''
	const digits = sign ? int.slice(1) : int
	const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	return frac ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`
}

export const formatEth = (wei: string): string => `${withThousands(weiToEth(wei))} ETH`

export const ethAmount = (wei: string): string => withThousands(weiToEth(wei))

export const serialOf = (programId: string, target: string): string => {
	const body = (target.startsWith('0x') ? target.slice(2) : target).toUpperCase()
	return `UL-${programId.padStart(4, '0')}-${body.slice(0, 4)}`
}

export const truncateHash = (hash: string, head = 10, tail = 8): string => {
	if (!hash) return ''
	if (hash.length <= head + tail + 1) return hash
	return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export interface SeverityMeta {
	label: Severity
	color: string
	wash: string
	blurb: string
}

export const severityMeta = (severity: Severity): SeverityMeta => {
	switch (severity) {
		case 'CRITICAL':
			return {
				label: 'CRITICAL',
				color: '#9b2233',
				wash: 'rgba(155,34,51,0.055)',
				blurb: 'The vault can be emptied.',
			}
		case 'HIGH':
			return {
				label: 'HIGH',
				color: '#a4521a',
				wash: 'rgba(164,82,26,0.055)',
				blurb: 'A major share of the vault is reachable.',
			}
		case 'MEDIUM':
			return {
				label: 'MEDIUM',
				color: '#7a5a14',
				wash: 'rgba(122,90,20,0.055)',
				blurb: 'A meaningful loss, short of the whole vault.',
			}
		case 'LOW':
			return {
				label: 'LOW',
				color: '#1d5b3f',
				wash: 'rgba(29,91,63,0.055)',
				blurb: 'A minor loss the vault can absorb.',
			}
		default:
			return {
				label: 'NONE',
				color: '#5d6b62',
				wash: 'transparent',
				blurb: 'The replay moved nothing. Nothing to reward.',
			}
	}
}
