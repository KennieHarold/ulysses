import { Icon } from './Icon'
import { markOf } from '../lib/pipeline'
import type { Status } from './StatusBar'
import type { Verdict } from '../lib/verdict'

interface Props {
	status: Status
	verdict: Verdict | null
	network: string
}

const WORK = [
	'Open the envelope with the enclave private key.',
	'Fork the named network at its current head.',
	'Replay the decrypted calldata against the target.',
	'Read the vault balance before and after, and price the difference.',
	'Sign the result, then discard the plaintext.',
] as const

export const AdjudicateZone = ({ status, verdict, network }: Props) => {
	const running = status === 'awaiting'
	const done = Boolean(verdict)

	return (
		<section className="clause" aria-labelledby="adjudicate-h">
			<div className="clause-head">
				<span className="clause-mark">{markOf('Adjudicate')}</span>
				<h2 id="adjudicate-h">Adjudicate</h2>
			</div>
			<p className="sub">
				The only step nobody can watch. Inside the enclave the envelope is opened, the exploit is
				replayed against a fork, and the damage is measured. This is the one moment your calldata
				exists in the clear anywhere, and it ends when the enclave discards it.
			</p>

			<div className={`enclave${running ? ' running' : ''}${done ? ' done' : ''}`}>
				<div className="enclave-head">
					<Icon name={done ? 'check' : running ? 'spinner' : 'lock'} size={15} className={running ? 'spin' : undefined} />
					<span>
						{done
							? `Replayed on ${verdict?.network ?? network} and measured`
							: running
								? 'Working inside the enclave…'
								: 'Sealed. Nothing runs until you submit.'}
					</span>
				</div>
				<ol className="enclave-work">
					{WORK.map((line) => (
						<li key={line}>{line}</li>
					))}
				</ol>
				<p className="enclave-note">
					No log, no trace and no copy of the plaintext leaves this step. What comes out is the
					verdict below, and nothing else.
				</p>
			</div>
		</section>
	)
}
