# Party-HQ

Party-HQ is the external control plane for multi-agent ops: approvals, chat, workspace context, and runtime visibility. Phantasy is the first-class integration, but the wire contract is framework-agnostic so OpenClaw-likes, Claude Code, OpenCode, Codex, Paperclip-style runtimes, and custom agents can register the same way.

Protocol reference: [Generated Party-HQ Protocol Inventory](/docs/generated/party-hq-protocol)
Repo strategy: [Party-HQ Control Plane](/docs/architecture/party-hq-control-plane)

## Phantasy Integration

Phantasy exposes four Party-HQ surfaces:

| Surface            | Path                                      | Purpose                                                                                 |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Approval callback  | `/admin/api/webhooks/party-hq`            | Receives approved tweets and posts through the local X integration                      |
| Character card     | `/admin/api/character-card`               | Exposes agent identity, avatars, and personality for Party-HQ rendering                 |
| Integration status | `/admin/api/integrations/party-hq/status` | Shows whether the bridge is configured and which endpoints are active                   |
| Runtime bridge     | `src/plugins/x/party-hq-sync-service.ts`  | Registers the agent with Party-HQ on boot and sends heartbeats, traces, and run results |

## Config

First boot:

```bash
PARTY_HQ_URL=https://party-hq.example.com
PARTY_HQ_BOOTSTRAP_TOKEN=phb_xxxxxxxxxxxx
AGENT_FRAMEWORK_URL=https://agent.example.com
```

Steady state:

```bash
PARTY_HQ_URL=https://party-hq.example.com
PARTY_HQ_API_KEY=pha_xxxxxxxxxxxx
PARTY_HQ_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
PARTY_HQ_CHARACTER_CARD_API_KEY=ccard_xxxxxxxxxxxx
AGENT_FRAMEWORK_URL=https://agent.example.com
```

`PARTY_HQ_BOOTSTRAP_TOKEN` is short-lived and only for first-time provisioning. After the first successful sync, persist `PARTY_HQ_API_KEY`, `PARTY_HQ_WEBHOOK_SECRET`, and the dedicated character-card key in your secret store. `PARTY_HQ_WEBHOOK_SECRET` must match on both sides because Party-HQ signs callbacks with it. Do not reuse that webhook secret as the `X-API-Key` for `/admin/api/character-card`; use `PARTY_HQ_CHARACTER_CARD_API_KEY` or `CHARACTER_CARD_API_KEYS`.

If you need to reprovision an existing external runtime, issue a fresh bootstrap token. Do not move the durable runtime key through the browser.

## What Phantasy Registers

On startup, the sync service sends:

- `frameworkType: "phantasy"`
- `frameworkVersion`
- a Phantasy-specific subset of the shared Party-HQ capability IDs
- explicit endpoint metadata for callback, health, and character card when a dedicated character-card API key is configured
- agent identity fields such as `name`, `bio`, `avatarUrl`, and `twitterUsername`

The full payload shape lives in the generated protocol doc, not this page.

## Approval Flow

1. Phantasy submits a tweet to Party-HQ.
2. Party-HQ creates a `tweet_approval` task plus a pending approval record.
3. An operator approves or rejects that task in the Party-HQ UI.
4. On approval, Party-HQ sends `tweet.approved` to `/admin/api/webhooks/party-hq`.
5. Phantasy posts via `XService` and returns the resulting Twitter ID.
6. Phantasy can also push `tweet.status_update` back to Party-HQ for bidirectional state sync.

## Orchestration Surfaces

The protocol now includes generic control-plane endpoints in Party-HQ for external runtimes:

- `POST /webhook/heartbeat`
- `POST /webhook/run-trace`
- `POST /webhook/run-result`

Those are for ticket checkout, live execution traces, and terminal run state. Phantasy now exposes them through `PartyHQSyncService`, so a Phantasy runtime can register, request work, stream execution events, and close runs without pretending the control plane is tweet-only.

Inside Party-HQ itself:

- every heartbeat updates the agent's last-seen time and next expected check-in
- idle heartbeats can claim queued or delegated tickets
- the operator UI can create child tickets from a parent task
- tickets behind `require_approval` policies stay blocked until an operator review moves them to `ready`

## Compatibility Model

Party-HQ stores the runtime `frameworkType`, capability list, and endpoint map separately from the Phantasy-specific bridge. That keeps the Phantasy UX native while letting other runtimes register the same control-plane contract without pretending to be Phantasy.

## Keeping Docs Accurate

Do not hand-maintain payload examples in this file. The source of truth is:

- `apps/party-hq/packages/shared/src/protocol.ts` for the Party-HQ wire contract
- `apps/docs/src/docs/content/generated/party-hq-protocol.md` for the generated public inventory
- `scripts/validate-standards.ts` for the Phantasy-to-Party-HQ contract drift check
- `apps/party-hq/convex/orchestration.ts` for the control-plane workflow state machine

## Troubleshooting

If sync fails:

- confirm `PARTY_HQ_URL` and either `PARTY_HQ_BOOTSTRAP_TOKEN` or the steady-state credentials
- confirm `AGENT_FRAMEWORK_URL` is public and correct
- confirm `PARTY_HQ_CHARACTER_CARD_API_KEY` or `CHARACTER_CARD_API_KEYS` is configured if you expect Party-HQ to fetch `/admin/api/character-card`
- hit `/admin/api/integrations/party-hq/status` and verify the endpoint map plus `status`

If callbacks fail:

- confirm Party-HQ and Phantasy share the same webhook secret
- confirm the request timestamp is within five minutes
- confirm the local X credentials are configured if Party-HQ is approving tweets for posting
