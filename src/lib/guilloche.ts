const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619

const hashSeed = (seed: string): number => {
	let h = FNV_OFFSET
	for (let i = 0; i < seed.length; i += 1) {
		h ^= seed.charCodeAt(i)
		h = Math.imul(h, FNV_PRIME)
	}
	return h >>> 0
}

const streamFrom = (seed: string) => {
	let state = hashSeed(seed) || 0x9e3779b9
	return () => {
		state ^= state << 13
		state >>>= 0
		state ^= state >>> 17
		state ^= state << 5
		state >>>= 0
		return state / 0x100000000
	}
}

const pick = <T>(next: () => number, values: readonly T[]): T =>
	values[Math.floor(next() * values.length) % values.length]

const between = (next: () => number, min: number, max: number): number =>
	min + next() * (max - min)

export interface RosetteSpec {
	petals: number
	depth: number
	rings: number
	ringSpread: number
	twist: number
	inner: number
}

export const rosetteSpec = (seed: string): RosetteSpec => {
	const next = streamFrom(seed)
	return {
		petals: pick(next, [5, 6, 7, 8, 9, 10, 11, 12, 13]),
		depth: between(next, 0.52, 0.92),
		rings: pick(next, [5, 6, 7, 8, 9]),
		ringSpread: between(next, 0.035, 0.085),
		twist: between(next, 0.04, 0.34),
		inner: between(next, 0.3, 0.52),
	}
}

const hypotrochoid = (
	radius: number,
	petals: number,
	depth: number,
	rotate: number,
	steps: number,
): string => {
	const r = radius / petals
	const base = radius - r
	const ratio = (radius - r) / r
	const parts: string[] = []
	for (let i = 0; i <= steps; i += 1) {
		const t = (i / steps) * Math.PI * 2
		const a = t + rotate
		const x = base * Math.cos(a) + depth * radius * Math.cos(ratio * a)
		const y = base * Math.sin(a) - depth * radius * Math.sin(ratio * a)
		parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
	}
	return `${parts.join('')}Z`
}

export const rosettePaths = (seed: string, radius = 100): string[] => {
	const spec = rosetteSpec(seed)
	const paths: string[] = []
	for (let ring = 0; ring < spec.rings; ring += 1) {
		const k = ring / Math.max(1, spec.rings - 1)
		const scale = 1 - k * spec.ringSpread * spec.rings * 0.5
		const depth = spec.depth * (1 - k * 0.22)
		paths.push(hypotrochoid(radius * scale, spec.petals, depth, k * spec.twist, 540))
	}
	for (let ring = 0; ring < Math.max(3, spec.rings - 2); ring += 1) {
		const k = ring / Math.max(1, spec.rings - 3)
		const scale = spec.inner * (1 - k * 0.16)
		paths.push(
			hypotrochoid(radius * scale, spec.petals + 2, spec.depth * 0.8, -k * spec.twist * 1.6, 420),
		)
	}
	return paths
}

export interface BandSpec {
	waves: number
	lines: number
	amplitude: number
	harmonic: number
}

export const bandSpec = (seed: string): BandSpec => {
	const next = streamFrom(seed)
	return {
		waves: pick(next, [3, 4, 5, 6, 7]),
		lines: pick(next, [7, 9, 11, 13]),
		amplitude: between(next, 0.22, 0.4),
		harmonic: pick(next, [2, 3, 4, 5]),
	}
}

export const bandPaths = (seed: string, width = 600, height = 40): string[] => {
	const spec = bandSpec(seed)
	const mid = height / 2
	const amp = height * spec.amplitude
	const steps = Math.max(160, Math.round(width / 2))
	const paths: string[] = []
	for (let line = 0; line < spec.lines; line += 1) {
		const phase = (line / spec.lines) * Math.PI * 2
		const parts: string[] = []
		for (let i = 0; i <= steps; i += 1) {
			const x = (i / steps) * width
			const u = (x / width) * Math.PI * 2 * spec.waves
			const y =
				mid +
				amp * Math.sin(u + phase) +
				amp * 0.42 * Math.sin(u * spec.harmonic - phase * 1.3) +
				amp * 0.18 * Math.sin(u * (spec.harmonic + 3) + phase * 0.6)
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)}`)
		}
		paths.push(parts.join(''))
	}
	return paths
}
