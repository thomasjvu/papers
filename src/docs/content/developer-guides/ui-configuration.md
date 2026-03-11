# UI Configuration

The template keeps content in the docs framework and exposes a few layout controls through code.

## `src/config/ui.ts`

Use this file for mobile docs-shell behavior.

Current options include:

- whether to show the floating mobile sidebar toggle
- where that toggle should appear on screen

## Docs Shell

The docs experience is centered on the left sidebar now:

- the logo sits at the top of the rail
- search opens from the sidebar instead of a top header
- settings live at the bottom of the sidebar
- the interactive map can be opened from the sidebar utilities

The main docs layout lives in `src/components/docs/DocumentationPage.tsx`.

## Theme And Font Controls

Theme, reduced motion, and font settings are managed through `ThemeProvider` and surfaced by `src/components/SettingsMenu.tsx`.

## Social Links

Footer social icons come from `src/constants/social.tsx`.

## Styling

Global colors, typography, shell spacing, and markdown presentation are defined in `src/globals.css`.

When making large visual changes, start there before editing many components individually.
