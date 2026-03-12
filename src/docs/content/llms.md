# LLMs.txt

This template generates AI-facing text exports from the docs corpus.

## Generated Files

- `/llms.txt`
- `/llms-full.txt`

## Why They Exist

These files give AI tools and internal agents a clean text entry point without requiring them to crawl the full UI.

## How They Are Generated

`npm run build` runs `scripts/generate-llms.mjs` automatically.

If you only want to refresh AI exports while writing, run:

```bash
npm run generate:llms
```

## When To Regenerate

Regenerate after:

- changing Markdown content
- renaming or restructuring docs sections
- updating docs metadata that should appear in exported summaries

## Helpful Links

<a href="/llms.txt" class="download-link" data-file="llms.txt">Download llms.txt</a>

<a href="/llms-full.txt" class="download-link" data-file="llms-full.txt">Download llms-full.txt</a>

<a href="#" class="copy-link" data-url="/llms.txt">Copy llms.txt URL</a>

## Preview

{llms-preview}
