# UI Configuration

The docs shell is mostly configured through a few focused files.

## `src/config/ui.ts`

Use this file for shell behavior that should be easy to change in a fork.

Right now it controls:

- whether the floating mobile file-tree button is shown
- where that mobile button appears

## Main Shell Layout

`src/components/docs/DocumentationPage.tsx` owns the docs layout:

- logo and search at the top of the left rail
- file tree in the middle
- map, `llms.txt`, and settings at the bottom
- content in the center
- `On This Page` or the interactive map in the right rail

## Theme, Motion, And Font Controls

These settings come from `ThemeProvider` and are surfaced through `SettingsMenu`.

The font control cycles through sans, mono, and serif instead of opening a dropdown.

## Supporting Configuration

- `src/constants/social.tsx`: footer links
- `src/globals.css`: shell tokens, typography, spacing, code styles
- `shared/documentation-config.js`: homepage content and docs structure

## Guidance

If a change is global, start with tokens or config.

If a change is specific to one interaction, edit the component directly.
