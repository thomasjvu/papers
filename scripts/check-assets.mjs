import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const fontsDir = path.join(publicDir, 'fonts');
const themeAssetManifestPath = path.join(publicDir, 'papers-theme-assets.json');
const resolvedThemePath = path.join(rootDir, 'src', 'lib', 'generated', 'papers-theme.json');

const BUDGETS = {
  default: { totalFontBytes: 2_000_000, maxFontBytes: 600_000 },
  gba: { totalFontBytes: 2_000_000, maxFontBytes: 600_000 },
  lorelei: { totalFontBytes: 2_000_000, maxFontBytes: 600_000 },
  'rx-78': { totalFontBytes: 2_000_000, maxFontBytes: 600_000 },
};
const IMAGE_BUDGET = { totalBytes: 5_000_000, maxBytes: 1_000_000 };
const FONT_EXTENSIONS = /\.(woff2?|ttf|otf)$/i;
const IMAGE_EXTENSIONS = /\.(avif|gif|jpeg|jpg|png|svg|webp)$/i;

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!existsSync(filePath)) {
    fail(`Missing ${filePath}. Run npm run resolve:theme first.`);
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Could not parse ${filePath}: ${error.message}`);
  }
}

function listFiles(dir, matcher) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(filePath, matcher);
    }
    return matcher.test(entry.name) ? [filePath] : [];
  });
}

function relativeFiles(files, root) {
  return files.map((filePath) => path.relative(root, filePath).split(path.sep).join('/')).sort();
}

function checkFonts(themeId, assetManifest) {
  const baseFontFiles = Array.isArray(assetManifest.baseFontFiles)
    ? assetManifest.baseFontFiles
    : [];
  const generatedFontFiles = Array.isArray(assetManifest.generatedFontFiles)
    ? assetManifest.generatedFontFiles
    : [];
  const expected = new Set([...baseFontFiles, ...generatedFontFiles]);
  const actual = relativeFiles(listFiles(fontsDir, FONT_EXTENSIONS), fontsDir).map((file) =>
    file.replace(/^\.\//, '')
  );
  const stale = actual.filter((file) => !expected.has(file));
  const missing = [...expected].filter((file) => !actual.includes(file));
  if (stale.length > 0) {
    fail(`Stale or unowned font assets: ${stale.join(', ')}.`);
  }
  if (missing.length > 0) {
    fail(`Manifest-listed font assets are missing: ${missing.join(', ')}.`);
  }

  const generatedThemeFiles = existsSync(path.join(rootDir, 'themes', themeId, 'assets', 'fonts'))
    ? relativeFiles(
        listFiles(path.join(rootDir, 'themes', themeId, 'assets', 'fonts'), FONT_EXTENSIONS),
        path.join(rootDir, 'themes', themeId, 'assets', 'fonts')
      )
    : [];
  if (JSON.stringify(generatedThemeFiles) !== JSON.stringify([...generatedFontFiles].sort())) {
    fail(`Theme font manifest does not match themes/${themeId}/assets/fonts.`);
  }

  const totalBytes = actual.reduce(
    (sum, file) => sum + statSync(path.join(fontsDir, file)).size,
    0
  );
  const largestBytes = actual.reduce(
    (largest, file) => Math.max(largest, statSync(path.join(fontsDir, file)).size),
    0
  );
  const budget = BUDGETS[themeId] || BUDGETS.default;
  if (totalBytes > budget.totalFontBytes) {
    fail(`Font budget exceeded for ${themeId}: ${totalBytes} > ${budget.totalFontBytes} bytes.`);
  }
  if (largestBytes > budget.maxFontBytes) {
    fail(
      `Largest font exceeds budget for ${themeId}: ${largestBytes} > ${budget.maxFontBytes} bytes.`
    );
  }

  return { files: actual, totalBytes, largestBytes };
}

function checkImages() {
  const files = listFiles(path.join(publicDir, 'images'), IMAGE_EXTENSIONS);
  const totalBytes = files.reduce((sum, filePath) => sum + statSync(filePath).size, 0);
  const largestBytes = files.reduce(
    (largest, filePath) => Math.max(largest, statSync(filePath).size),
    0
  );
  if (totalBytes > IMAGE_BUDGET.totalBytes) {
    fail(`Image budget exceeded: ${totalBytes} > ${IMAGE_BUDGET.totalBytes} bytes.`);
  }
  if (largestBytes > IMAGE_BUDGET.maxBytes) {
    fail(`Largest image exceeds budget: ${largestBytes} > ${IMAGE_BUDGET.maxBytes} bytes.`);
  }
  return { totalBytes, largestBytes };
}

function main() {
  const assetManifest = readJson(themeAssetManifestPath);
  const resolvedTheme = readJson(resolvedThemePath);
  const themeId = resolvedTheme.id;
  if (assetManifest.themeId !== themeId) {
    fail(`Asset manifest theme ${assetManifest.themeId} does not match resolved theme ${themeId}.`);
  }

  const fonts = checkFonts(themeId, assetManifest);
  const images = checkImages();
  console.log(
    `Asset checks passed for ${themeId}: ${fonts.files.length} fonts (${fonts.totalBytes} bytes), ` +
      `${images.totalBytes} image bytes.`
  );
}

try {
  main();
} catch (error) {
  console.error(`Asset check failed: ${error.message}`);
  process.exitCode = 1;
}
