import { Icon } from './Icon'
import { RAIL } from '../lib/pipeline'

export type Status = 'idle' | 'encrypting' | 'triggering' | 'awaiting' | 'done' | 'error'

const STEPS = RAIL

const REACHED: Record<Status, number> = {
	idle: -1,
	encrypting: 0,
	triggering: 1,
	awaiting: 2,
	done: 3,
	error: -1,
}

const inFlight = (s: Status) => s === 'encrypting' || s === 'triggering' || s === 'awaiting'

const announce = (status: Status, reached: number): string => {
	if (status === 'idle') return 'Not started. Four steps: seal, relay, adjudicate, verdict.'
	if (status === 'error') return 'Sealing failed at step 1 of 4, seal.'
	if (status === 'done') return 'Complete. The verdict has been issued.'
	return `Step ${reached + 1} of 4, ${STEPS[reached].toLowerCase()}, in progress.`
}

export const StatusBar = ({ status }: { status: Status }) => {
	const reached = REACHED[status]
	return (
		<>
			<p className="visually-hidden" role="status" aria-live="polite">
				{announce(status, reached)}
			</p>
			<div className="progress">
				{STEPS.map((label, i) => {
					const isDone = status === 'done' ? i <= reached : i < reached
					const isActive = inFlight(status) && i === reached
					const isError = status === 'error' && i === 0
					const cls = ['station', isDone && 'done', isActive && 'active', isError && 'error']
						.filter(Boolean)
						.join(' ')
					return (
						<div key={label} style={{ display: 'contents' }}>
							<div className={cls}>
								<span className="mark">
									{isDone ? (
										<Icon name="check" size={13} strokeWidth={2} />
									) : isActive ? (
										<Icon name="spinner" size={13} strokeWidth={2} className="spin" />
									) : isError ? (
										<Icon name="alert" size={13} strokeWidth={2} />
									) : (
										i + 1
									)}
								</span>
								<span className="name">{label}</span>
							</div>
							{i < STEPS.length - 1 && <span className="station-rule" />}
						</div>
					)
				})}
			</div>
		</>
	)
}
