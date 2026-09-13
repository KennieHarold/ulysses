import {
	encodeAbiParameters,
	getAddress,
	keccak256,
	type Address,
	type Hex,
} from 'viem'
import { config } from './config'
import { publicClient, getWalletClient } from './chain'
import type { Verdict } from './verdict'

export const SEVERITY_TO_UINT8: Record<Verdict['severity'], number> = {
	NONE: 0,
	LOW: 1,
	MEDIUM: 2,
	HIGH: 3,
	CRITICAL: 4,
}

export const SEVERITY_BY_INDEX = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export const escrowAbi = [
	{
		type: 'function',
		name: 'nextProgramId',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ type: 'uint256' }],
	},
	{
		type: 'function',
		name: 'claimed',
		stateMutability: 'view',
		inputs: [{ type: 'bytes32' }],
		outputs: [{ type: 'bool' }],
	},
	{
		type: 'function',
		name: 'getProgram',
		stateMutability: 'view',
		inputs: [{ name: 'programId', type: 'uint256' }],
		outputs: [
			{
				type: 'tuple',
				components: [
					{ name: 'sponsor', type: 'address' },
					{ name: 'target', type: 'address' },
					{ name: 'balance', type: 'uint256' },
					{ name: 'rewards', type: 'uint256[5]' },
					{ name: 'withdrawUnlockAt', type: 'uint256' },
					{ name: 'exists', type: 'bool' },
				],
			},
		],
	},
	{
		type: 'function',
		name: 'createProgram',
		stateMutability: 'payable',
		inputs: [
			{ name: 'target', type: 'address' },
			{ name: 'rewards', type: 'uint256[5]' },
		],
		outputs: [{ type: 'uint256' }],
	},
	{
		type: 'function',
		name: 'fundProgram',
		stateMutability: 'payable',
		inputs: [{ name: 'programId', type: 'uint256' }],
		outputs: [],
	},
	{
		type: 'function',
		name: 'claimReward',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: 'v',
				type: 'tuple',
				components: [
					{ name: 'severity', type: 'uint8' },
					{ name: 'lossAmount', type: 'uint256' },
					{ name: 'exploitHash', type: 'bytes32' },
					{ name: 'researcher', type: 'address' },
					{ name: 'programId', type: 'uint256' },
					{ name: 'target', type: 'address' },
					{ name: 'deadline', type: 'uint256' },
				],
			},
			{ name: 'signature', type: 'bytes' },
		],
		outputs: [],
	},
] as const

export interface Program {
	id: bigint
	sponsor: Address
	target: Address
	balance: bigint
	rewards: readonly [bigint, bigint, bigint, bigint, bigint]
	withdrawUnlockAt: bigint
	exists: boolean
}

const escrowContract = () => ({ address: config.escrowAddress, abi: escrowAbi }) as const

export const claimIdOf = (programId: bigint, exploitHash: Hex): Hex =>
	keccak256(
		encodeAbiParameters([{ type: 'uint256' }, { type: 'bytes32' }], [programId, exploitHash]),
	)

const toProgram = (id: bigint, raw: {
	sponsor: Address
	target: Address
	balance: bigint
	rewards: readonly bigint[]
	withdrawUnlockAt: bigint
	exists: boolean
}): Program => ({
	id,
	sponsor: raw.sponsor,
	target: raw.target,
	balance: raw.balance,
	rewards: raw.rewards as readonly [bigint, bigint, bigint, bigint, bigint],
	withdrawUnlockAt: raw.withdrawUnlockAt,
	exists: raw.exists,
})

export const getProgram = async (programId: bigint): Promise<Program | null> => {
	const raw = await publicClient.readContract({
		...escrowContract(),
		functionName: 'getProgram',
		args: [programId],
	})
	if (!raw.exists) return null
	return toProgram(programId, raw)
}

export const listPrograms = async (): Promise<Program[]> => {
	const next = await publicClient.readContract({
		...escrowContract(),
		functionName: 'nextProgramId',
	})
	const ids: bigint[] = []
	for (let i = 1n; i < next; i++) ids.push(i)
	const programs = await Promise.all(ids.map((id) => getProgram(id)))
	return programs.filter((p): p is Program => p !== null)
}

export const isClaimed = async (programId: bigint, exploitHash: Hex): Promise<boolean> =>
	publicClient.readContract({
		...escrowContract(),
		functionName: 'claimed',
		args: [claimIdOf(programId, exploitHash)],
	})

export const rewardForSeverity = (program: Program, severity: Verdict['severity']): bigint =>
	program.rewards[SEVERITY_TO_UINT8[severity]] ?? 0n

const connectedAccount = async (): Promise<Address> => {
	const wallet = getWalletClient()
	const [account] = await wallet.requestAddresses()
	if (!account) throw new Error('No wallet account authorized.')
	return account
}

export const createProgram = async (
	target: Address,
	rewards: readonly [bigint, bigint, bigint, bigint, bigint],
	fundingWei: bigint,
): Promise<Hex> => {
	const wallet = getWalletClient()
	const account = await connectedAccount()
	return wallet.writeContract({
		...escrowContract(),
		functionName: 'createProgram',
		args: [getAddress(target), rewards],
		value: fundingWei,
		account,
	})
}

export const fundProgram = async (programId: bigint, amountWei: bigint): Promise<Hex> => {
	const wallet = getWalletClient()
	const account = await connectedAccount()
	return wallet.writeContract({
		...escrowContract(),
		functionName: 'fundProgram',
		args: [programId],
		value: amountWei,
		account,
	})
}

export const claimReward = async (verdict: Verdict): Promise<Hex> => {
	if (!verdict.signature || !verdict.researcher || verdict.programId === undefined || !verdict.target) {
		throw new Error('verdict is not claimable: missing signature, researcher, programId, or target')
	}
	const wallet = getWalletClient()
	const account = await connectedAccount()
	return wallet.writeContract({
		...escrowContract(),
		functionName: 'claimReward',
		args: [
			{
				severity: SEVERITY_TO_UINT8[verdict.severity],
				lossAmount: BigInt(verdict.lossAmount),
				exploitHash: verdict.exploitHash as Hex,
				researcher: getAddress(verdict.researcher),
				programId: BigInt(verdict.programId),
				target: getAddress(verdict.target),
				deadline: 0n,
			},
			verdict.signature as Hex,
		],
		account,
	})
}
