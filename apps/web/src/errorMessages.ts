export const ERROR_GUIDANCE: Record<string, string> = {
  credential_unavailable:
    'This identity has no Selfie Check credential. Confirm the Sandbox identity has completed a Selfie Check, and that the Beta flag is enabled for this app.',
  feature_unavailable:
    'Selfie Check is not enabled for this app. It is access-gated Beta — request enablement from developers@toolsforhumanity.com before this flow can pass.',
  verification_rejected:
    'World App rejected the request. This is the known mixed-mode failure: selfieCheckLegacy is a World ID 3.0 credential, so allow_legacy_proofs must be true. Check VITE_ALLOW_LEGACY_PROOFS.',
  world_id_3_not_available:
    'The app refused to produce a World ID 3.0 proof. selfieCheckLegacy can only return 3.0 — verify allow_legacy_proofs is true.',
  invalid_rp_signature:
    'The RP signature did not validate. Confirm WORLD_RP_SIGNING_KEY matches the key registered for WORLD_RP_ID, and that the action is signed into the request.',
  rp_signature_expired:
    'The rp_context expired before capture completed. Raise RP_SIGNATURE_TTL_SECONDS or start the check sooner after signing.',
  unknown_rp: 'WORLD_RP_ID is not recognised by the Portal. Confirm the RP is registered.',
  inactive_rp: 'This RP is registered but inactive. Re-check its status in the Developer Portal.',
  duplicate_nonce: 'This nonce was already used. Each check needs a fresh call to /rp/sign.',
  max_verifications_reached:
    'This identity has hit the action verification limit. Raise max verifications on the action in the Portal to keep re-testing.',
  user_rejected: 'The check was cancelled in World App.',
  connection_failed: 'Could not reach World App. Check the phone has network access.',
};
