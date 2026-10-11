import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = await readFile('src/docs/content/getting-started/introduction.md', 'utf8');
const body = source.replace(/^---[\s\S]*?---\s*/, '').trim();
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Papers fixture</title>
  </head>
  <body>
    <main><h1>Getting started</h1><p>${body}</p></main>
  </body>
</html>
`;

await mkdir('dist/docs/getting-started', { recursive: true });
await writeFile('dist/docs/getting-started/introduction.html', html);
