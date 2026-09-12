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

export const truncateHash = (hash: string, head = 10, tail = 8): string => {
	if (!hash) return ''
	if (hash.length <= head + tail + 1) return hash
	return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export interface SeverityMeta {
	label: Severity
	color: string
	glow: string
	blurb: string
}

export const severityMeta = (severity: Severity): SeverityMeta => {
	switch (severity) {
		case 'CRITICAL':
			return {
				label: 'CRITICAL',
				color: '#ff4d4f',
				glow: 'rgba(255,77,79,0.45)',
				blurb: 'Catastrophic drain',
			}
		case 'HIGH':
			return { label: 'HIGH', color: '#ff9f43', glow: 'rgba(255,159,67,0.4)', blurb: 'Major loss' }
		case 'MEDIUM':
			return {
				label: 'MEDIUM',
				color: '#ffd43b',
				glow: 'rgba(255,212,59,0.35)',
				blurb: 'Meaningful loss',
			}
		case 'LOW':
			return { label: 'LOW', color: '#38d9a9', glow: 'rgba(56,217,169,0.3)', blurb: 'Minor loss' }
		default:
			return {
				label: 'NONE',
				color: '#8b949e',
				glow: 'rgba(139,148,158,0.25)',
				blurb: 'No drain detected',
			}
	}
}
