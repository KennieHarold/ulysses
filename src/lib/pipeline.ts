export const PIPELINE = ['Seal', 'Relay', 'Adjudicate', 'Verdict', 'Redeem'] as const

export type Stage = (typeof PIPELINE)[number]

export const RAIL: readonly Stage[] = PIPELINE.slice(0, 4)

export const markOf = (stage: Stage): string =>
	String(PIPELINE.indexOf(stage) + 1).padStart(2, '0')
