# Design Principles

Phantasy lets you build an AI companion/VTuber who can run her own site, content, automations, and business.

This repo is intentionally organized around a few constraints:

## Product Layer By Workspace

The product surface should organize around five workspaces:

- `Character`
- `Site`
- `Business`
- `Automations`
- `Operations`

Transport layers such as admin API, admin UI, CLI, and website mode should read as adapters over those domains rather than as the primary mental model.

## What Stays In Core

`@phantasy/core-runtime` should contain only what every agent needs:

- config loading and validation
- provider routing contracts
- memory and storage interfaces
- workflow execution
- plugin contracts and hook execution
- shared orchestration that is hard to externalize

Core should stay small, low-privilege, and easy to audit.

## What Stays Out Of Core

Anything privileged, product-specific, or operational should live outside the trusted base:

- coding tools in `@phantasy/profile-coder`
- persona, memory, voice, and media features in `@phantasy/profile-character`
- HTTP admin and dashboard concerns in `@phantasy/server-admin`
- niche verticals and specialized integrations in extensions, plugins, or deeper docs

That boundary is architectural, not narrative. Character surfaces, CMS features, and business workflows are central to the product story even when they live outside the trusted core.

## Character Identity And Capability Are Orthogonal

Tool surface and character identity are separate choices.

A coding agent can also be a companion. A companion can also be a coding agent.

```json
{
  "pluginProfiles": ["coder", "character"]
}
```

That is the intended shape for agents like Kurisu: one runtime, one character layer, multiple capability profiles.

## Companions Are First-Class Product Surfaces

Phantasy is not a generic agent framework with a character skin taped on later.

The distinct product wedge is:

- Live2D and VRM companion/VTuber surfaces
- built-in admin/CMS tooling around that companion
- website and headless publishing
- workflow orchestration for business and application logic

The runtime exists so those pieces can share memory, identity, permissions, and operations instead of becoming four disconnected products.

## Main Narrative vs Long Tail

The main docs should lead with the three primary stories:

- an AI companion/VTuber as the product surface
- self-hosted CMS, publishing, and business products around her
- workflow and application orchestration around the same runtime

Coding agents and other specialized verticals still matter, but they should be presented as additional surfaces on top of the same system.

## Source Of Truth

Narrative docs explain intent. Generated inventories explain what is actually implemented.

When they disagree, fix the docs or the code until they match.
