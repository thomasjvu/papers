# Licensing And Governance Memo

This memo documents the current recommendation for licensing, trademarks, contributions, and future commercial surfaces.

It is a product and release memo, not legal advice.

## Current State

Phantasy currently ships under the MIT license in the repository root.

Supporting surfaces already aligned with that decision:

- root `LICENSE`
- `package.json` license metadata
- [Release Policy](../guides/RELEASE_POLICY.md)

## Recommendation

Keep the flagship open-source framework on MIT for now.

Reasons:

- the repo is already aligned on MIT
- permissive licensing helps adoption and integrations
- the current priority is category capture and distribution
- the company moat should come from brand, ecosystem, and official services, not from a restrictive core license

## Do Not Rush A Relicense

Do not switch licenses casually.

Relicensing gets harder once a repo has multiple contributors and automation authors in the history.

Before any future relicense, Phantasy should first confirm:

- who owns all copyright in existing contributions
- whether outside contributions have been accepted under clear inbound terms
- whether a contributor license agreement is needed

Until that work is done, the safest course is to keep the core repo MIT and strengthen the surrounding governance.

## Commercial Strategy Boundary

The open-source core should remain the adoption layer.

Commercial surfaces can exist, but they should be clearly separate from the MIT core repo.

Good examples of separable commercial or managed surfaces:

- hosted control-plane services
- verified extension distribution
- team and enterprise operational features
- managed deployment and support offerings

If a future commercial add-on is created, it should have:

- explicit licensing
- clear repository or package boundaries
- no ambiguity about whether it is part of the MIT core

## Trademark Strategy

The copyright license is not the same thing as trademark permission.

That distinction matters because forks can copy code but should not be able to present themselves as the official Phantasy product.

Phantasy should therefore keep:

- the core code open
- the brand protected

The root `TRADEMARKS.md` file is the operational policy for this.

## Contribution Policy

Phantasy should use an inbound-equals-outbound contribution model for the MIT core:

- contributions to the MIT repo are accepted under MIT
- contributors should only submit work they have the right to license that way
- signed-off commits should become the default contribution hygiene

That keeps the open-source core legible while preserving optionality for separate commercial surfaces.

## Why Not Use A Restrictive License Right Now

A more restrictive license would reduce fork freedom, but it would also reduce adoption, integrations, and trust.

That is the wrong trade-off while Phantasy is still trying to become the default name in its category.

The better near-term answer is:

- open distribution
- protected brand
- official ecosystem
- future managed products

## Review Point For Later

Revisit the licensing strategy if one of these becomes true:

- enterprise buyers require a stronger patent story
- contributor volume increases substantially
- commercial add-ons become a major product layer
- the company decides to create a formal CLA program

If that review happens, evaluate the change deliberately and only after a contributor-rights audit.
