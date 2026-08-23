import { join } from 'path';

import {
  GENERATED_DOCS_SOURCE_ENV,
  getGeneratedDocsSourceDir,
  syncGeneratedDocsDirectory,
} from './lib/generatedDocsSync.mjs';

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(
      [
        'Usage: npm run sync:generated -- --source <directory>',
        '',
        `The source may also be set with ${GENERATED_DOCS_SOURCE_ENV}.`,
        'The command syncs Markdown and MDX files into src/docs/content/generated/.',
      ].join('\n')
    );
    return;
  }

  const rootDir = process.cwd();
  const sourceDir = getGeneratedDocsSourceDir({ rootDir });

  if (!sourceDir) {
    throw new Error(
      `Missing generated docs source. Pass --source <dir> or set ${GENERATED_DOCS_SOURCE_ENV}.`
    );
  }

  const destinationDir = join(rootDir, 'src', 'docs', 'content', 'generated');
  const result = await syncGeneratedDocsDirectory(sourceDir, destinationDir);

  console.log(`Synced ${result.written} generated docs from ${sourceDir}.`);
  if (result.missing.length > 0) {
    console.log(`Added: ${result.missing.join(', ')}`);
  }
  if (result.changed.length > 0) {
    console.log(`Updated: ${result.changed.join(', ')}`);
  }
  if (result.extra.length > 0) {
    console.log(`Removed: ${result.extra.join(', ')}`);
  }
}

main().catch((error) => {
  console.error('Generated docs sync failed:', error.message);
  process.exit(1);
});
