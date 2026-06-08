import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rm, unlink, writeFile } from 'fs/promises';
import path from 'path';

export const GENERATED_DOCS_SOURCE_ENV = 'PAPERS_GENERATED_DOCS_SOURCE';

function normalizeMarkdownPath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

export function getGeneratedDocsSourceDir(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const cliArgs = options.cliArgs || process.argv.slice(2);
  const sourceIndex = cliArgs.findIndex((arg) => arg === '--source');
  const explicitSource =
    sourceIndex >= 0 && cliArgs[sourceIndex + 1] ? cliArgs[sourceIndex + 1] : null;
  const envSource =
    typeof options.sourceDir === 'string' && options.sourceDir.trim()
      ? options.sourceDir
      : process.env[GENERATED_DOCS_SOURCE_ENV];
  const rawSource = explicitSource || envSource;

  if (!rawSource) {
    return null;
  }

  return path.resolve(rootDir, rawSource);
}

async function listMarkdownFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(absolutePath, relativePath)));
      continue;
    }

    if (/\.mdx?$/i.test(entry.name)) {
      files.push(normalizeMarkdownPath(relativePath));
    }
  }

  return files.sort();
}

export async function readMarkdownFileMap(dir) {
  if (!existsSync(dir)) {
    return new Map();
  }

  const files = await listMarkdownFiles(dir);
  const entries = await Promise.all(
    files.map(async (relativePath) => {
      const absolutePath = path.join(dir, relativePath);
      return [relativePath, await readFile(absolutePath, 'utf8')];
    })
  );

  return new Map(entries);
}

export function diffMarkdownFileMaps(sourceFiles, destinationFiles) {
  const missing = [];
  const extra = [];
  const changed = [];

  for (const [relativePath, sourceContent] of sourceFiles.entries()) {
    if (!destinationFiles.has(relativePath)) {
      missing.push(relativePath);
      continue;
    }

    if (destinationFiles.get(relativePath) !== sourceContent) {
      changed.push(relativePath);
    }
  }

  for (const relativePath of destinationFiles.keys()) {
    if (!sourceFiles.has(relativePath)) {
      extra.push(relativePath);
    }
  }

  return {
    missing: missing.sort(),
    extra: extra.sort(),
    changed: changed.sort(),
  };
}

export async function syncGeneratedDocsDirectory(sourceDir, destinationDir) {
  const sourceFiles = await readMarkdownFileMap(sourceDir);
  const destinationFiles = await readMarkdownFileMap(destinationDir);
  const diff = diffMarkdownFileMaps(sourceFiles, destinationFiles);

  if (!existsSync(sourceDir)) {
    throw new Error(`Generated docs source does not exist: ${sourceDir}`);
  }

  await mkdir(destinationDir, { recursive: true });

  for (const relativePath of diff.extra) {
    await unlink(path.join(destinationDir, relativePath));
  }

  for (const [relativePath, content] of sourceFiles.entries()) {
    const absolutePath = path.join(destinationDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }

  const destinationEntries = await readdir(destinationDir, { withFileTypes: true });
  await Promise.all(
    destinationEntries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const absolutePath = path.join(destinationDir, entry.name);
        const children = await readdir(absolutePath);
        if (children.length === 0) {
          await rm(absolutePath, { recursive: true, force: true });
        }
      })
  );

  return {
    ...diff,
    written: sourceFiles.size,
  };
}
