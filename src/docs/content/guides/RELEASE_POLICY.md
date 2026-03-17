Release and Relicensing Policy

Goals

- Keep the repository and published framework artifacts aligned with the MIT license in the repo root.
- Treat generated docs, live manifest inventories, and examples as part of that licensing surface so they do not drift.
- Keep trademark policy and contribution policy aligned with the release surface so open-source code and official branding do not get conflated.

Policy

1. Current branch and released framework code: MIT.
2. On release, update docs and generated inventories together with the code.
3. If commercial add-ons exist, keep them out of the MIT-licensed core repo unless their licensing is made explicit and isolated.
4. The open-source code license does not grant trademark rights; the root `TRADEMARKS.md` file governs brand usage.
5. Contributions to the MIT core should remain inbound-equals-outbound unless and until a different contribution policy is explicitly adopted.

Implementation Notes

- The repository root `LICENSE` file is the source of truth.
- Generated docs, manifest schemas, and example manifests should mirror the repo license.
- Root `TRADEMARKS.md` is the source of truth for brand usage around the open-source repo.
- `../development/contributing.md` is the source of truth for contribution hygiene expectations.

Automation (optional)

- Add a release check that validates `LICENSE`, docs, and live manifest inventories before tagging.
