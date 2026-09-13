import { NavLink } from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'
import { Rosette } from './Guilloche'

const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

export const Nav = () => (
	<header className="masthead">
		<div className="masthead-inner">
			<NavLink to="/" className="brand">
				<Rosette
					seed="ulysses-mark"
					size={32}
					className="brand-seal"
					strokeWidth={1.05}
					ringLimit={2}
				/>
				<span>
					<span className="brand-name">Ulysses</span>
					<span className="brand-sub">Confidential bounty escrow</span>
				</span>
			</NavLink>
			<nav className="nav-links" aria-label="Primary">
				<NavLink to="/register" className={linkClass}>
					Register
				</NavLink>
				<NavLink to="/submissions" className={linkClass}>
					My vouchers
				</NavLink>
				<NavLink to="/sponsor" className={linkClass}>
					Sponsor
				</NavLink>
			</nav>
			<ConnectWallet />
		</div>
	</header>
)
