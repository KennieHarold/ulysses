const PATHS = {
	seal: (
		<>
			<circle cx="12" cy="10" r="6.25" />
			<circle cx="12" cy="10" r="3" />
			<path d="M8.6 15.4 7.2 21l4.8-2.3 4.8 2.3-1.4-5.6" />
		</>
	),
	lock: (
		<>
			<rect x="4.25" y="10.5" width="15.5" height="9.25" rx="1.4" />
			<path d="M7.9 10.5V7.6a4.1 4.1 0 0 1 8.2 0v2.9" />
			<path d="M12 14v2.5" />
		</>
	),
	key: (
		<>
			<circle cx="7.4" cy="12" r="3.65" />
			<path d="M11.05 12H21" />
			<path d="M17.6 12v3.1" />
			<path d="M20.2 12v2.2" />
		</>
	),
	coupon: (
		<>
			<path d="M3.25 7.1h17.5v3.2a1.7 1.7 0 0 0 0 3.4v3.2H3.25v-3.2a1.7 1.7 0 0 0 0-3.4Z" />
			<path d="M13.4 7.1v1.8M13.4 11.1v1.8M13.4 15.1v1.8" strokeDasharray="0.1 2.6" />
		</>
	),
	wallet: (
		<>
			<path d="M20.4 9.2V7.5a1.6 1.6 0 0 0-1.6-1.6H5.2a1.9 1.9 0 0 0 0 3.8h14.2a1.4 1.4 0 0 1 1.4 1.4v6.4a1.6 1.6 0 0 1-1.6 1.6H5.2a1.9 1.9 0 0 1-1.9-1.9V7.8" />
			<path d="M16.6 13.4h1.5" />
		</>
	),
	alert: (
		<>
			<path d="M12 4.4 21 19.6H3Z" />
			<path d="M12 10v3.6" />
			<path d="M12 16.6v.05" />
		</>
	),
	check: <path d="M4.5 12.6 9.6 17.6 19.5 6.9" />,
	arrow: (
		<>
			<path d="M4.5 12h14.2" />
			<path d="M13.6 6.9 18.7 12l-5.1 5.1" />
		</>
	),
	eyeOff: (
		<>
			<path d="M9.6 5.2A9.3 9.3 0 0 1 12 4.9c5.2 0 8.6 4.2 9.4 6.4a1.7 1.7 0 0 1 0 1.4 12 12 0 0 1-2.4 3.4" />
			<path d="M16.3 16.9a9.2 9.2 0 0 1-4.3 1c-5.2 0-8.6-4.2-9.4-6.4a1.7 1.7 0 0 1 0-1.4 12.3 12.3 0 0 1 3.1-4" />
			<path d="M10.1 10.1a2.7 2.7 0 0 0 3.8 3.8" />
			<path d="M3.6 3.6 20.4 20.4" />
		</>
	),
	ledger: (
		<>
			<path d="M5.2 3.9h11.4a2.2 2.2 0 0 1 2.2 2.2v14H7.4a2.2 2.2 0 0 1-2.2-2.2Z" />
			<path d="M5.2 17.1h13.6" />
			<path d="M8.6 8.1h6.8M8.6 11.5h6.8" />
		</>
	),
	deposit: (
		<>
			<path d="M12 3.9v9.8" />
			<path d="M8.2 10.2 12 14l3.8-3.8" />
			<path d="M4.2 16.4v2.1a1.6 1.6 0 0 0 1.6 1.6h12.4a1.6 1.6 0 0 0 1.6-1.6v-2.1" />
		</>
	),
	copy: (
		<>
			<rect x="8.4" y="8.4" width="11.4" height="11.4" rx="1.5" />
			<path d="M15.6 5.9V5.7a1.5 1.5 0 0 0-1.5-1.5H5.7a1.5 1.5 0 0 0-1.5 1.5v8.4a1.5 1.5 0 0 0 1.5 1.5h.2" />
		</>
	),
	spinner: <path d="M12 3.4a8.6 8.6 0 1 0 8.6 8.6" />,
	perforation: <path d="M12 3v18" strokeDasharray="2 3" />,
} as const

export type IconName = keyof typeof PATHS

interface Props {
	name: IconName
	size?: number
	className?: string
	strokeWidth?: number
}

export const Icon = ({ name, size = 16, className, strokeWidth = 1.5 }: Props) => (
	<svg
		className={className}
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		role="presentation"
		aria-hidden="true"
		focusable="false"
	>
		{PATHS[name]}
	</svg>
)
