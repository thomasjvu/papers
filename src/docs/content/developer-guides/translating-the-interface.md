---
description: Translate or rename the labels in the docs chrome, per locale.
---

# Translating The Interface

Page content is translated by adding locale folders. The labels around the
content come from `shared/uiStrings.js`. This includes the pager, the footer,
code blocks, the sidebar and right rail, the mindmap, and the command palette's
commands, scope buttons and hints. You can translate or rename them per locale.

## Set Labels For A Locale

Add the labels to `uiStringsConfig` in `shared/documentation-config.js`. Use
the locale codes from `i18nConfig.locales`. Labels that you leave out keep the
English default.

```js title="shared/documentation-config.js"
export const i18nConfig = {
  enabled: true,
  defaultLocale: 'en',
  locales: ['en', 'fr'],
  labels: { en: 'EN', fr: 'FR' },
};

export const uiStringsConfig = {
  fr: {
    previous: 'Précédent',
    next: 'Suivant',
    lastUpdated: 'Mis à jour le',
    searchDocs: 'Rechercher',
    copyCode: 'Copier',
    onThisPage: 'Sur cette page',
    commandFont: 'Police : {font}',
    mindmapResultMany: '{count} résultats',
  },
};
```

To rename a label on a site with one language, add an entry for the default
locale, for example `en: { edit: 'Edit this page' }`.

The page language comes from the URL. Dates in the **Last updated** line use
the same locale.

## Available Labels

Some labels are templates. Keep their `{placeholders}` in the translation,
for example `{count}` in `mindmapResultMany`.

### Pages, Code And Search

| Key                 | Default                                      |
| ------------------- | -------------------------------------------- |
| `previous`          | Previous                                     |
| `next`              | Next                                         |
| `adjacentPages`     | Adjacent documentation pages (screen reader) |
| `lastUpdated`       | Last updated                                 |
| `edit`              | edit                                         |
| `issue`             | issue                                        |
| `source`            | source                                       |
| `pageSourceActions` | Page source actions (screen reader)          |
| `searchDocs`        | Search docs                                  |
| `searchPlaceholder` | Search documentation or type a command...    |
| `noResults`         | No results found for                         |
| `searchScope`       | Search scope (screen reader)                 |
| `searchScopeAll`    | All                                          |
| `searchScopeDocs`   | Docs                                         |
| `searchScopeApi`    | API                                          |
| `copyCode`          | Copy to clipboard                            |
| `copied`            | Copied                                       |
| `showLineNumbers`   | Show line numbers                            |
| `hideLineNumbers`   | Hide line numbers                            |
| `referencedBy`      | Referenced by                                |

### Sidebar And Right Rail

| Key                     | Default                       |
| ----------------------- | ----------------------------- |
| `sidebarNavigation`     | Documentation (screen reader) |
| `closeSidebar`          | Close sidebar                 |
| `showDocumentationTree` | Show documentation tree       |
| `onThisPage`            | On This Page                  |
| `interactiveMap`        | Interactive Map               |
| `showTableOfContents`   | Show table of contents        |
| `showInteractiveMap`    | Show interactive map          |
| `version`               | Version                       |

### Mindmap

| Key                                | Default                   |
| ---------------------------------- | ------------------------- |
| `mindmapSearchPlaceholder`         | Search docs...            |
| `mindmapSearchPlaceholderExpanded` | Search documents...       |
| `mindmapZoomIn`                    | Zoom in                   |
| `mindmapZoomOut`                   | Zoom out                  |
| `mindmapReset`                     | Reset                     |
| `mindmapResetView`                 | Reset view (Ctrl/Cmd + 0) |
| `mindmapExpand`                    | Expand interactive map    |
| `mindmapExpandShort`               | Expand map                |
| `mindmapClose`                     | Close expanded mindmap    |
| `mindmapLegendPages`               | Pages                     |
| `mindmapLegendCurrent`             | Current                   |
| `mindmapLegendFolder`              | Folder                    |
| `mindmapLegendTags`                | Tags                      |
| `mindmapLegendMatches`             | Matches                   |
| `mindmapResultOne`                 | {count} result            |
| `mindmapResultMany`                | {count} results           |
| `mindmapNoMatches`                 | No matches found          |

### Command Palette

| Key                              | Default                                     |
| -------------------------------- | ------------------------------------------- |
| `commandLightMode`               | Switch to Light Mode                        |
| `commandDarkMode`                | Switch to Dark Mode                         |
| `commandEnableMotion`            | Enable Motion                               |
| `commandReduceMotion`            | Reduce Motion                               |
| `commandFont`                    | Font: {font}                                |
| `fontSansSerif`                  | Sans Serif                                  |
| `fontMonospace`                  | Monospace                                   |
| `fontSerif`                      | Serif                                       |
| `commandSwitchLocale`            | Switch to {language}                        |
| `commandSwitchLocaleDescription` | Change documentation language to {language} |
| `commandLlms`                    | LLMs.txt - AI Documentation                 |
| `commandAgentSkill`              | Agent Skill - {site}                        |
| `commandHomepage`                | Go to Homepage                              |
| `paletteNavigateHint`            | to navigate                                 |
| `paletteOpenHint`                | to open or preview                          |
| `paletteCloseHint`               | to close                                    |
| `faqPreview`                     | FAQ Preview                                 |
| `badgeAction`                    | action                                      |
| `badgeFaq`                       | faq                                         |

The built-in FAQ answers in the command palette are still English only.

## Validation

`npm run generate:docs` (and so `npm run build`) fails if `uiStringsConfig`
uses a locale that is not in `i18nConfig.locales`, an unknown key, an empty
value, or a template whose `{placeholders}` differ from the default. This keeps
a typo from hiding a label.
