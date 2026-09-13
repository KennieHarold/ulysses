# Ulysses

**Get paid for the drain. Never hand it over.**

Bug bounties have a fatal asymmetry: to *prove* the bug, the researcher must *disclose* the exploit, before any money moves. The sponsor reads the working attack, then decides whether to pay. Trust flows one way, and the leverage flows the other.

Ulysses inverts it. The exploit is sealed in the browser and never leaves it in the clear. A sealed enclave replays it, measures the real loss, and signs a verdict. **Only the verdict comes back out, and the verdict is the money.**

---

## How it works

1. **Seal.** The researcher encrypts the exploit calldata in the browser to the enclave's public key (X25519 → HKDF-SHA256 → XChaCha20-Poly1305 sealed box). The plaintext never touches the wire, a server, or the sponsor.
2. **Relay.** The ciphertext is sent to a [Chainlink CRE](https://chain.link) workflow that runs **inside an AWS Nitro TEE**. Only the enclave holds the decryption key.
3. **Adjudicate.** Inside the enclave: decrypt → replay the attack against the live target via `eth_simulateV1` → measure the actual drain from `Transfer` logs → derive a severity tier. The plaintext is read *once*, in the enclave, and is never re-published.
4. **Verdict.** The enclave emits an EIP-712 signed verdict: `{severity, lossAmount, exploitHash, researcher, programId, target}`. A severity and a commitment hash, nothing that reveals *how*.
5. **Redeem.** The researcher submits the verdict to `BountyEscrow`. The contract verifies the attestor signature on-chain and pays the tier reward. The sponsor pays for a proven, priced drain **without ever reading the exploit.**

```
  Browser                    Nitro TEE (Chainlink CRE)              Chain
 ┌────────┐   ciphertext    ┌──────────────────────────┐  verdict  ┌──────────────┐
 │ seal   │ ──────────────► │ decrypt · replay · price │ ────────► │ BountyEscrow │
 │exploit │                 │      sign (EIP-712)      │  +sig     │  pays tier   │
 └────────┘                 └──────────────────────────┘           └──────────────┘
   plaintext stays here ◄─── the perforation ───► only the verdict crosses
```

## Why it's different

- **Non-custodial disclosure.** The exploit is cryptographically withheld end-to-end. The sponsor gets a price, not a payload.
- **Trustless pricing.** Severity isn't self-reported. The enclave *runs* the exploit against the real contract and reads the loss off the transfer logs.
- **On-chain settlement.** No arbiter, no escrow agent. A signed verdict is a bearer claim; the contract is the only judge, and it's replay-safe (`claimId = keccak(programId, exploitHash)`) and reentrancy-guarded.

## Repo layout

| Path | What |
|------|------|
| `cre/exploit-verifier/` | The CRE workflow: TEE entrypoint, sealed-box crypto, decrypt→simulate→sign pipeline |
| `contracts/src/BountyEscrow.sol` | EIP-712 escrow: fund programs, claim against a signed verdict, delayed withdraw |
| `contracts/src/Vulnerable*.sol` | Reentrancy targets used to demonstrate a real drain end-to-end |
| `src/` | React 19 + viem front end: seal, trigger, and render the verdict |
| `docs/` | Captured proofs: enclave decrypt, exploit drain, and HTTP-triggered run |

## Run it

```bash
pnpm install
pnpm dev                                   # front end
pnpm --dir contracts test                  # exploit + escrow proofs
cd cre/exploit-verifier && cre workflow simulate   # replay the enclave locally
```

## Stack

React 19 · viem · Chainlink CRE (AWS Nitro TEE) · Solidity (EIP-712) · `@noble` X25519 / XChaCha20-Poly1305 · Alchemy `eth_simulateV1`
