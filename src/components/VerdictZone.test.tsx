import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerdictZone } from './VerdictZone'
import type { Verdict } from '../lib/verdict'

const CRITICAL: Verdict = {
	severity: 'CRITICAL',
	lossAmount: '4200000000000000000000',
	targetFunction: 'withdraw()',
	exploitHash: '0xb0e31374f71f4e34784b485ee4fb05dde8cb07c4e1bc4b1bdf48f16f779db839',
}

describe('VerdictZone', () => {
	it('renders the severity label and color-codes CRITICAL red', () => {
		const { container } = render(<VerdictZone verdict={CRITICAL} source="test" />)

		expect(screen.getByText('CRITICAL')).toBeInTheDocument()

		const sev = container.querySelector('.sev') as HTMLElement
		expect(sev).toBeTruthy()
		expect(sev.getAttribute('data-severity')).toBe('CRITICAL')
		expect(sev.style.getPropertyValue('--sev-color')).toBe('#ff4d4f')
	})

	it('formats the loss from wei to grouped ETH', () => {
		render(<VerdictZone verdict={CRITICAL} source="test" />)
		expect(screen.getByText('4,200 ETH')).toBeInTheDocument()
		expect(screen.getByText('4200000000000000000000 wei')).toBeInTheDocument()
	})

	it('shows the target function and a truncated exploit hash with a copy button', () => {
		render(<VerdictZone verdict={CRITICAL} source="test" />)
		expect(screen.getByText('withdraw()')).toBeInTheDocument()
		expect(screen.getByText('0xb0e31374f71f…f16f779db839')).toBeInTheDocument()
		expect(screen.queryByText(CRITICAL.exploitHash)).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
	})

	it('color-codes NONE grey', () => {
		const none: Verdict = { ...CRITICAL, severity: 'NONE', lossAmount: '0' }
		const { container } = render(<VerdictZone verdict={none} source="test" />)
		const sev = container.querySelector('.sev') as HTMLElement
		expect(sev.style.getPropertyValue('--sev-color')).toBe('#8b949e')
		const lossValue = container.querySelector('.vfield .vvalue') as HTMLElement
		expect(lossValue.textContent).toBe('0 ETH')
	})

	it('shows the target contract and network when the verdict carries them', () => {
		const withTarget: Verdict = {
			...CRITICAL,
			target: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
			network: 'eth-sepolia',
		}
		render(<VerdictZone verdict={withTarget} source="test" />)
		expect(screen.getByText('target contract')).toBeInTheDocument()
		expect(screen.getByText('replayed on eth-sepolia')).toBeInTheDocument()
		expect(screen.getByTitle(withTarget.target as string)).toBeInTheDocument()
	})

	it('omits the target field and uses a generic fork label when absent', () => {
		render(<VerdictZone verdict={CRITICAL} source="test" />)
		expect(screen.queryByText('target contract')).not.toBeInTheDocument()
		expect(screen.getByText('replayed on a fork')).toBeInTheDocument()
	})
})
