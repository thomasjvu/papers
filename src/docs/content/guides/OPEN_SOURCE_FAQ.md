# Open Source FAQ

This FAQ is the public-facing answer set for common questions about Phantasy's open-source model.

## Is Phantasy open source?

Yes.

The core Phantasy framework in this repository is open source and currently licensed under MIT.

## Can I self-host it?

Yes.

Self-hosting is a core part of the product story. The flagship path today is the self-hosted runtime plus the local admin UI, CLI, and extension system.

## Do I need a hosted Phantasy service to use it?

No.

You can use the framework without waiting for a hosted multi-tenant product.

We are prioritizing the self-hosted product and the official ecosystem first. Additional managed surfaces may come later where they remove real operational pain.

## Can I use Phantasy commercially?

Yes.

The repository is currently MIT-licensed. Review the root `LICENSE` file for the exact terms.

## Can I build plugins, themes, skills, and workflows for it?

Yes.

That is part of the intended model. Phantasy is designed to support extension and ecosystem growth around the core runtime.

## Can I fork Phantasy?

Yes.

The code is open source.

## Can a fork call itself Phantasy?

No.

The open-source code license does not grant trademark rights. If you distribute a modified fork, use your own name and branding. See the root `TRADEMARKS.md` policy.

## Why open source it if people can fork it?

Because the goal is not to make the code impossible to copy.

The goal is to make Phantasy the default stack, brand, and ecosystem in its category.

Open source helps with trust, adoption, integrations, and community growth. The company value should come from the official ecosystem, product taste, brand, and future managed surfaces.

## Are you going to offer official managed products?

Likely yes over time, but we are not forcing that dependency into the product before the self-hosted wedge is strong.

Our current priority is:

1. great self-hosted experience
2. clear flagship use case
3. strong official ecosystem

Managed surfaces should come in where they make the most sense.

## What is Phantasy actually for?

Phantasy is the default stack for:

- VTuber-native sites
- companion-native businesses
- character-led publishing and operations

The simplest description is:

- `Build an AI companion/VTuber who can run her own site, content, automations, and business.`

## Is Phantasy a general-purpose agent framework?

Not primarily.

It has agent infrastructure, but the strongest product story is character-native: companion identity, site, content, workflows, and business running on one runtime.

## How should I think about the product in one sentence?

Fast shortcut:

- `WordPress for AI companions`

Standalone version:

- `The operating system for companion-native sites, publishing, and business.`

## How do contributions work?

Unless explicitly stated otherwise, contributions to this repository are accepted under the same MIT license as the project.

We ask contributors to use signed-off commits:

```bash
git commit -s
```

## Where should I start?

Start here:

- `npm install @phantasy/agent`
- `npx phantasy create vtuber my-brand`

If you want a zero-install one-off run instead:

- `npx @phantasy/agent create vtuber my-brand`

If you want the fastest path to the flagship story, use the `vtuber` shape first.
