# Use Cases

Phantasy is broad. The docs are opinionated about where it lands best.

## 1. `business-cms`

This is the flagship story.

You are building a public-facing companion or VTuber. She has a site, a publishing flow, automations, and business operations around the same identity.

Typical stack:

- Chronicle publishing
- website modes and themes
- Live2D, VRM, or PNGTuber presentation
- notifications, integrations, and workflows behind the scenes

Start here if you want the shortest path to a coherent product.

## 2. `operator`

This is the same runtime with operations foregrounded.

Use it when the companion is also the operator for approvals, publishing queues, automation runs, or internal tooling. The important part is that the character layer and the operational layer still share one system.

## 3. `creator`

This is the publishing-forward version.

Use it when content, media, and distribution are the most visible part of the product, but you still want the companion identity, workflows, and operational surface behind it.

## How To Choose Quickly

- If you are unsure, choose `business-cms`.
- If users notice operations first, choose `operator`.
- If users notice publishing first, choose `creator`.

All three shapes sit on the same runtime and the same five workspaces. The difference is emphasis, not architecture.

## Good Follow-Up Pages

- [Website Modes](/docs/website-mode)
- [Chronicle](/docs/features/chronicle)
- [Live2D Setup](/docs/guides/LIVE2D_SETUP)
- [Consuming Phantasy](/docs/guides/CONSUMING_PHANTASY)
