# Phala TEE Testing

Use this when validating Phantasy inside a Phala CVM or against the local dstack simulator.

## What The Runtime Supports

- Real Intel TDX quote generation through Phala `dstack` / `tappd`
- Quote verification through the Phala Cloud attestation API
- Development-only stub fallback when explicitly allowed

Non-TDX TEEs currently fail closed.

## Deployment Gate

Run this inside the deployed workload:

```bash
bun run tee:test -- --tee tdx --require-real --require-cloud-verify
```

This must produce:

- `attestation.source = "phala-dstack"`
- `verification.valid = true`
- `verification.details.verificationMode = "phala-cloud-api"`

If it falls back to a stub or structural-only verification, treat the deployment as not production-ready.

## Local Simulator

If you are testing outside a Phala CVM, point the runtime at the dstack simulator:

```bash
export DSTACK_SIMULATOR_ENDPOINT=http://localhost:8090
bun run tee:test -- --tee tdx --require-real
```

If you also want remote verification, leave `TEE_VERIFY_WITH_PHALA_API` enabled and ensure the generated quote is accepted by the verifier.

## Debug Fallbacks

Only use these for development:

```bash
bun run tee:test -- --tee tdx --allow-stub --skip-remote-verify
```

Useful environment variables:

- `DSTACK_SIMULATOR_ENDPOINT`
- `TAPPD_SIMULATOR_ENDPOINT`
- `TEE_VERIFY_WITH_PHALA_API=false`
- `PHALA_CLOUD_ATTESTATION_VERIFY_URL=<override>`
- `TEE_ALLOW_UNVERIFIED_TDX=true`
- `TEE_ALLOW_STUB_ATTESTATION=true`

## Failure Modes

- `No reachable Phala dstack/tappd endpoint was found`
  The workload does not have a mounted Phala socket and no simulator endpoint is configured.
- `Expected a real Phala TDX attestation`
  The runtime generated a development stub instead of a real quote.
- `Expected Phala Cloud verification`
  The quote only passed structural checks and was not verified by the Phala attestation API.
