import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SubmitZone, canSubmit, type ExploitForm } from './SubmitZone'

const PUB = '0x375128744ecd24947690752d5fc2f80b48133372874dd28b16afbd5e610ff90b'

const fullForm = (overrides: Partial<ExploitForm> = {}): ExploitForm => ({
	to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
	network: 'eth-sepolia',
	token: 'native',
	from: '',
	value: '0',
	calldata: '0x9e5faafc',
	...overrides,
})

const renderZone = (form: ExploitForm, busy = false) => {
	const onChange = vi.fn()
	const onSubmit = vi.fn()
	render(
		<SubmitZone
			form={form}
			onChange={onChange}
			enclavePublicKey={PUB}
			onSubmit={onSubmit}
			busy={busy}
		/>,
	)
	return { onChange, onSubmit }
}

describe('canSubmit', () => {
	it('requires target, network, and calldata', () => {
		expect(canSubmit(fullForm())).toBe(true)
		expect(canSubmit(fullForm({ to: '' }))).toBe(false)
		expect(canSubmit(fullForm({ network: '  ' }))).toBe(false)
		expect(canSubmit(fullForm({ calldata: '' }))).toBe(false)
	})

	it('does not require the optional from/value/token fields', () => {
		expect(canSubmit(fullForm({ from: '', value: '', token: '' }))).toBe(true)
	})
})

describe('SubmitZone', () => {
	it('renders the target, network, token and calldata fields', () => {
		renderZone(fullForm())
		expect(screen.getByLabelText(/target contract/i)).toHaveValue(
			'0x5FbDB2315678afecb367f032d93F642f64180aa3',
		)
		expect(screen.getByLabelText(/network/i)).toHaveValue('eth-sepolia')
		expect(screen.getByLabelText(/token/i)).toHaveValue('native')
		expect(screen.getByLabelText(/calldata/i)).toHaveValue('0x9e5faafc')
	})

	it('reports field edits back through onChange as a patch', () => {
		const { onChange } = renderZone(fullForm())
		fireEvent.change(screen.getByLabelText(/network/i), { target: { value: 'eth-mainnet' } })
		expect(onChange).toHaveBeenCalledWith({ network: 'eth-mainnet' })
	})

	it('enables submit when the required fields are present and fires onSubmit', () => {
		const { onSubmit } = renderZone(fullForm())
		const button = screen.getByRole('button', { name: /submit exploit/i })
		expect(button).toBeEnabled()
		fireEvent.click(button)
		expect(onSubmit).toHaveBeenCalledOnce()
	})

	it('disables submit while busy or when a required field is missing', () => {
		renderZone(fullForm({ to: '' }))
		expect(screen.getByRole('button', { name: /submit exploit/i })).toBeDisabled()
	})

	it('shows a working label while busy', () => {
		renderZone(fullForm(), true)
		expect(screen.getByRole('button', { name: /working/i })).toBeDisabled()
	})
})
