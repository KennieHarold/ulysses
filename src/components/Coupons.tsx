import type { CSSProperties } from 'react'
import { SEVERITY_BY_INDEX, type Program } from '../lib/escrow'
import { formatEth, severityMeta } from '../lib/format'

export const Coupons = ({ program }: { program: Program }) => (
	<div className="coupons">
		{[4, 3, 2, 1].map((i) => {
			const sev = SEVERITY_BY_INDEX[i]
			const meta = severityMeta(sev)
			const reward = program.rewards[i]
			const unfunded = reward > program.balance
			return (
				<div
					key={i}
					className={`coupon${unfunded ? ' unfunded' : ''}`}
					style={{ '--sev-color': meta.color } as CSSProperties}
				>
					<span className="tier">{sev}</span>
					<span className="fee">{formatEth(reward.toString())}</span>
					{unfunded && <span className="note">over pool</span>}
				</div>
			)
		})}
	</div>
)
