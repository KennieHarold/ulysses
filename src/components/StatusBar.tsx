export type Status = 'idle' | 'encrypting' | 'triggering' | 'awaiting' | 'done' | 'error'

const STEPS = ['Encrypt', 'Trigger', 'Await verdict', 'Done'] as const

const REACHED: Record<Status, number> = {
	idle: -1,
	encrypting: 0,
	triggering: 1,
	awaiting: 2,
	done: 3,
	error: -1,
}

const inFlight = (s: Status) => s === 'encrypting' || s === 'triggering' || s === 'awaiting'

export const StatusBar = ({ status }: { status: Status }) => {
	const reached = REACHED[status]
	return (
		<div className="stepper" role="status" aria-live="polite">
			{STEPS.map((label, i) => {
				const isDone = status === 'done' ? i <= reached : i < reached
				const isActive = inFlight(status) && i === reached
				const isError = status === 'error' && i === 0
				const cls = ['step', isDone && 'done', isActive && 'active', isError && 'error']
					.filter(Boolean)
					.join(' ')
				return (
					<div key={label} style={{ display: 'contents' }}>
						<div className={cls}>
							<span className="dot">
								{isDone ? '✓' : isActive ? <span className="spin">◠</span> : isError ? '!' : i + 1}
							</span>
							<span>{label}</span>
						</div>
						{i < STEPS.length - 1 && <span className="step-sep" />}
					</div>
				)
			})}
		</div>
	)
}
