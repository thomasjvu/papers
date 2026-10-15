---
description: Translate or rename the labels in the docs chrome, per locale.
---

# Translating The Interface

Page content is translated by adding locale folders. The labels around the
content, such as **Previous**, **Next**, **Last updated**, and the copy button,
come from `shared/uiStrings.js`. You can translate or rename them per locale.

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
  },
};
```

To rename a label on a site with one language, add an entry for the default
locale, for example `en: { edit: 'Edit this page' }`.

The page language comes from the URL. Dates in the **Last updated** line use
the same locale.

## Available Labels

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
| `copyCode`          | Copy to clipboard                            |
| `copied`            | Copied                                       |
| `showLineNumbers`   | Show line numbers                            |
| `hideLineNumbers`   | Hide line numbers                            |
| `referencedBy`      | Referenced by                                |

## Validation

`npm run generate:docs` (and so `npm run build`) fails if `uiStringsConfig`
uses a locale that is not in `i18nConfig.locales`, an unknown key, or an empty
value. This keeps a typo from hiding a label.
