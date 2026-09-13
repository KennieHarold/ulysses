import { useMemo } from 'react'
import { bandPaths, rosettePaths } from '../lib/guilloche'

interface RosetteProps {
	seed: string
	size?: number
	className?: string
	strokeWidth?: number
	ringLimit?: number
}

export const Rosette = ({
	seed,
	size = 120,
	className,
	strokeWidth = 0.6,
	ringLimit,
}: RosetteProps) => {
	const paths = useMemo(() => {
		const all = rosettePaths(seed)
		return ringLimit ? all.slice(0, ringLimit) : all
	}, [seed, ringLimit])
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="-108 -108 216 216"
			role="presentation"
			aria-hidden="true"
			focusable="false"
		>
			<g fill="none" stroke="currentColor" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke">
				{paths.map((d, i) => (
					<path key={i} d={d} />
				))}
			</g>
		</svg>
	)
}

interface BandProps {
	seed: string
	className?: string
	height?: number
	strokeWidth?: number
}

export const Band = ({ seed, className, height = 34, strokeWidth = 0.5 }: BandProps) => {
	const paths = useMemo(() => bandPaths(seed, 600, height), [seed, height])
	return (
		<svg
			className={className}
			viewBox={`0 0 600 ${height}`}
			preserveAspectRatio="none"
			role="presentation"
			aria-hidden="true"
			focusable="false"
		>
			<g fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
				{paths.map((d, i) => (
					<path key={i} d={d} />
				))}
			</g>
		</svg>
	)
}
