# UI Configuration

The template separates content structure from UI behavior.

## `src/config/ui.ts`

Use this file for mobile docs layout toggles.

Current options include:

- whether to show a floating mobile file-tree button
- where that button should appear

## Theme And Font Controls

Theme, reduced motion, and font settings are managed through `ThemeProvider` and surfaced in the header settings menu.

## Navigation Links

The top navigation lives in `src/components/Navigation.tsx`.

Change it if you want different global destinations in the header.

## Social Links

Footer social icons come from `src/constants/social.tsx`.

## Styling

Global colors, typography, code block styling, and markdown presentation are defined in `src/globals.css`.

When making large visual changes, start there before editing many components individually.
