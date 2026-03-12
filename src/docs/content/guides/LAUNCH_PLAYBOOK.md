# Launch Playbook

This is the launch filter for Phantasy.

If a feature, screenshot, demo, or paragraph does not strengthen the flagship story below, move it to advanced docs, label it clearly, or leave it out of the launch surface.

## Flagship Sentence

Phantasy lets you build an AI companion/VTuber who can run her own site, content, automations, and business.

Shorter version:

- WordPress for AI companions
- companion/VTuber first, site + content + workflows + business around her
- the companion is the product surface, not a chatbot glued onto a backend

## Homepage Copy

Headline:

`Build an AI companion/VTuber who can run her own site, content, automations, and business.`

Supporting sentence:

`Phantasy gives you one self-hosted runtime for companion identity, Live2D or VRM presence, Chronicle publishing, workflows, channels, and operations.`

Proof points for the first screenful:

- the companion is the product
- one runtime for identity, publishing, and operations
- Live2D or VRM presence plus Chronicle content flows
- workflows, notifications, and business surfaces around the same character
- explicit trust boundaries, not an everything-is-core framework

Primary CTA:

`npm install @phantasy/agent`

Secondary CTA:

`npx phantasy create business-cms my-brand`

## Lead With

- `business-cms` as the default starting shape
- the companion/VTuber as the protagonist of the product
- the five-workspace product model: Character, Site, Business, Automations, Operations
- Chronicle as the built-in publishing engine
- website modes: public, private, and api-only
- Live2D and VRM as first-class character presentation
- one runtime for the companion, the site, the business logic, and the operator tooling
- trust boundaries: small core, opt-in privileged profiles

## Do Not Lead With

- every plugin, provider, or niche integration
- crypto, markets, ACP, or trading surfaces
- experimental or narrow presets as if they define the framework
- “general purpose agent framework” positioning
- infrastructure migration history
- narrow side-mode mechanics as if they are the whole framework

Those surfaces can remain supported. They should not define first impression or homepage copy.

## Launch Demo Shape

The best public demo should show one companion business, not a toolbox tour.

Recommended sequence:

1. Open on the public-facing companion or VTuber landing page.
2. Show the `Character` workspace and configure identity plus appearance.
3. Publish a Chronicle entry or edit the website in the `Site` workspace.
4. Return to the public site and show the result.
5. Trigger an automation, approval, or notification flow.
6. Show a business surface such as integrations, channels, or monetization.
7. End by showing the five workspaces together as one operating system around the companion.

## Screenshot Order

For a homepage, README, or launch thread, prefer this screenshot stack:

1. Hero shot: the companion on her public site.
2. Character setup: identity, avatar, Live2D, or VRM.
3. Publishing: Chronicle editor or website workspace.
4. Output: published page, blog, or themed site view.
5. Operations: automation, approval, or notifications.
6. Business: channels, integrations, or monetization.

Do not use this order:

1. Provider settings
2. Plugin lists
3. Logs, tests, or workbench
4. Specialist crypto or market surfaces

That sequence makes the repo feel like tooling before it feels like a product.

## Demo Talk Track

Use a short, repeatable talk track:

1. "This is the companion."
2. "This is where she runs her site and content."
3. "This is how she automates work and handles approvals."
4. "This is how channels and business operations stay attached to the same identity."

## Open Source Checklist

- README opens with the flagship sentence in the first screenful.
- The first runnable path is `npm install @phantasy/agent` plus `npx phantasy create business-cms`.
- The docs have one obvious beginner path and one obvious 10-minute demo path.
- CLI help separates flagship shapes from specialist presets.
- Stale docs that describe old architecture work are archived or rewritten.
- Screenshots use the business-cms story, not a random mix of features.
- The repo shows that the product is coherent even if the extension ecosystem is still early.

## Product Cleanup Checklist

- Keep `business-cms`, `operator`, and `creator` as the only front-door shapes.
- Mark specialist presets as advanced or legacy instead of beginner defaults.
- Keep theme, workflow, and skill ecosystem claims honest about current inventory.
- Push niche surfaces deeper in docs and UI copy unless they support the flagship wedge.
- Prefer examples that publish, automate, and monetize around a recognizable companion identity.

## Acquihire Checklist

Acquirers should immediately see:

- coherent product taste
- architecture discipline
- explicit trust boundaries
- product taxonomy instead of random feature sprawl
- a team that can ship both framework infrastructure and user-facing surfaces

If the repo reads like a collection of experiments, the acquihire value drops even if the code is strong.

## Final Rule

Ship the wedge, not the whole universe.

The wedge is not “agents.”

The wedge is: build a companion who can run her own business.
