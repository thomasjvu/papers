# Chronicle

Chronicle is Phantasy's publishing surface.

It lets the companion draft, publish, approve, syndicate, and serve content from the same runtime as the site and admin shell.

## What It Covers

- manual entries from the Content surface
- public blog delivery under `/blog`
- approval-based publishing flows
- optional scheduled generation
- optional syndication after publish

## Entry Model

Chronicle entries support the fields you would expect:

- `title`, `content`, `tags`
- `visibility`: `private`, `public`, `unlisted`
- `status`: `draft`, `published`, `archived`
- `slug`, `excerpt`, `featuredImage`
- `mood`, `template`, `metadata`
- `publishedPlatforms`

Slugs are generated when missing. Tags are normalized and capped.

## Public Blog Routes

When website mode allows the embedded site, Chronicle serves:

- `GET /blog`
- `GET /blog/:slug`
- `GET /blog/tag/:tag`
- `GET /blog/feed.xml`
- `GET /blog/feed.json`
- `GET /blog/sitemap.xml`

Route access still respects website mode:

- `public`: public
- `private`: admin/operator preview
- `api-only`: blog HTML disabled

For listing and single-post routes, `Accept: application/json` returns JSON instead of HTML.

## Admin Surface

The current admin/content API lives here:

- `GET /admin/api/content/entries`
- `POST /admin/api/content/entries`
- `GET /admin/api/content/entries/:id`
- `PUT /admin/api/content/entries/:id`
- `DELETE /admin/api/content/entries/:id`
- `POST /admin/api/content/notifications/:id/approve`
- `POST /admin/api/content/notifications/:id/reject`

Useful query params:

- `page`
- `pageSize` or `limit`
- `q`
- `visibility`
- `status`
- `tags`
- `sort`

## Scheduled Posting

Chronicle can generate entries on an interval with controls for:

- `intervalMinutes`
- `requireApproval`
- `postingHours`
- `maxPostsPerDay`
- template selection

There is also a separate `generateDailyJournal()` path that uses the `calendar` template and folds in notes or memory context when available.

## Syndication

After a public publish, Chronicle can format content for:

- Twitter/X
- Discord

Discord delivery uses `platforms.discord.chronicleChannelId` when configured.

## Config Note

Chronicle configuration shows up in two places in the codebase today:

- `chronicleConfig` in the agent schema
- the Chronicle plugin config used by the runtime service

If scheduled posting is not behaving the way you expect, verify the active runtime path, not just the schema.

## Good Default

Start simple:

- publish manually first
- make `/blog` feel right
- add approval before autonomous posting
- syndicate only after the public site is solid

## Related Docs

- [Website Mode](/docs/website-mode)
- [Admin API](/docs/api/admin-api)
- [Generated API Routes](/docs/generated/api-routes)
- [10 Minute Launch](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
