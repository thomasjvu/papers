# Changelog

## 0.1.0 - 2026-03-12

First public beta release.

### Highlights

- added generated route-level HTML metadata for docs and `llms` pages
- switched build-time metadata generation to Vite-native env loading
- removed the third-party runtime icon script and tightened CSP headers
- fixed Cloudflare deployment behavior so generated route HTML can be served directly
- made docs landing routes and internal links config-driven instead of sample-path hardcoded
- preserved correct GitHub edit and source links for both `.md` and `.mdx` documents
- added release validation commands for artifact checks and served preview checks
- added route-aware version and locale scaffolding with content-variant resolution
- updated search, sitemap, `llms.txt`, and SEO metadata to use canonical docs routes

### Release Notes

This release is ready for public beta use as a static documentation framework.

Known limitations:

- versioning and i18n are supported structurally, but disabled by default in `shared/documentation-config.js`
- browser-interaction E2E coverage is still lightweight and focused on served-route smoke checks