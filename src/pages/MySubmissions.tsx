import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ClaimButton } from '../components/ClaimButton'
import { Rosette } from '../components/Guilloche'
import { Icon } from '../components/Icon'
import { listVouchers, listVouchersFor, type Voucher } from '../lib/vouchers'
import { formatEth, severityMeta, truncateHash } from '../lib/format'
import { isClaimable } from '../lib/verdict'
import { useWallet } from '../hooks/useWallet'

const VoucherCard = ({ voucher, onClaimed }: { voucher: Voucher; onClaimed: () => void }) => {
	const { verdict } = voucher
	const meta = severityMeta(verdict.severity)
	return (
		<div className="voucher" style={{ '--sev-color': meta.color } as CSSProperties}>
			<div className="voucher-seal">
				<Rosette seed={verdict.exploitHash} size={58} strokeWidth={0.5} />
				<span className="sev-badge">{verdict.severity}</span>
			</div>
			<div className="voucher-body">
				<div className="voucher-head">
					<span className="voucher-program">Program №{voucher.programId}</span>
					<span className="voucher-loss">
						{formatEth(verdict.lossAmount)}
						<span>measured loss</span>
					</span>
				</div>
				<div className="voucher-grid">
					<div>
						<div className="vlabel">exploit hash</div>
						<code title={verdict.exploitHash}>{truncateHash(verdict.exploitHash, 12, 10)}</code>
					</div>
					<div>
						<div className="vlabel">pays out to</div>
						<code title={voucher.researcher}>{truncateHash(voucher.researcher, 8, 6)}</code>
					</div>
					<div>
						<div className="vlabel">issued</div>
						<span>{new Date(voucher.createdAt).toLocaleString()}</span>
					</div>
				</div>
				{isClaimable(verdict) ? (
					<ClaimButton verdict={verdict} onClaimed={onClaimed} />
				) : (
					<span className="claim-note">
						Not redeemable: this verdict is unsigned, or came back NONE.
					</span>
				)}
			</div>
		</div>
	)
}

export const MySubmissions = () => {
	const { address } = useWallet()
	const [vouchers, setVouchers] = useState<Voucher[]>([])

	const refresh = useCallback(() => {
		setVouchers(address ? listVouchersFor(address) : listVouchers())
	}, [address])

	useEffect(() => {
		refresh()
	}, [refresh])

	return (
		<div className="sheet">
			<div className="sheet-body">
				<Rosette seed="ulysses-vouchers" size={260} className="watermark" strokeWidth={0.5} />

				<div className="sheet-head">
					<div>
						<h1 className="sheet-title">
							Your coupons, <em>signed and unspent.</em>
						</h1>
						<p className="lede">
							Every verdict the enclave signs is a bearer coupon, held right here in this browser.
							Whoever holds it can redeem it, so redeeming moves the reward to the payout address
							written into the signature. Redemption status is read live from the escrow.
						</p>
					</div>
				</div>

				{!address && (
					<div className="empty" style={{ marginBottom: 20 }}>
						<Icon name="wallet" size={26} className="empty-mark" strokeWidth={1.2} />
						Connect a wallet to narrow this down to your own payout address.
					</div>
				)}

				{vouchers.length === 0 ? (
					<div className="empty">
						<Icon name="coupon" size={26} className="empty-mark" strokeWidth={1.2} />
						No coupons yet. <Link to="/register">Find a program and submit an exploit</Link>
					</div>
				) : (
					<div className="voucher-list">
						{vouchers.map((v) => (
							<VoucherCard
								key={`${v.programId}:${v.verdict.exploitHash}:${v.researcher}`}
								voucher={v}
								onClaimed={refresh}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
