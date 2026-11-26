import { existsSync } from 'fs';
import { join } from 'path';

// Static instances of the card fonts at the weights the card template uses:
// Hubot Sans 800 for the title, Mona Sans 400 for the body text, and Mona
// Sans 800 as the title fallback. They are subsetted to Latin, Latin-1
// Supplement, General Punctuation and Currency Symbols, and keep the
// original family names. The upstream files are variable fonts whose default
// instance is ExtraLight (wght 200); resvg renders only the default
// instance, so this file used to fake weight with a same-colour stroke
// (emboldenSvgText). Static instances make that unnecessary.
const CARD_FONT_FILES = ['Mona-Sans-400.ttf', 'Mona-Sans-800.ttf', 'Hubot-Sans-800.ttf'];

let resvgModulePromise = null;

async function loadResvg() {
  if (!resvgModulePromise) {
    resvgModulePromise = import('@resvg/resvg-js').catch((error) => {
      resvgModulePromise = null;
      throw error;
    });
  }
  return resvgModulePromise;
}

export function socialCardFontFiles(fontDir) {
  return CARD_FONT_FILES.map((file) => join(fontDir, file)).filter((file) => existsSync(file));
}

/**
 * Rasterise a social card SVG to PNG with the bundled fonts so the output is
 * identical on macOS and Linux CI. Returns `null` (never throws) when the
 * native renderer is unavailable or the SVG cannot be rendered, so callers can
 * keep the SVG card as a fallback.
 */
export async function renderSocialCardPng(svg, { fontFiles = [], width = 1200 } = {}) {
  if (process.env.PAPERS_SOCIAL_CARD_FORMAT === 'svg') return null;
  try {
    const { Resvg } = await loadResvg();
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: width },
      background: '#090909',
      font: {
        fontFiles,
        loadSystemFonts: fontFiles.length === 0,
        defaultFontFamily: 'Mona Sans',
        sansSerifFamily: 'Mona Sans',
        monospaceFamily: 'Mona Sans',
      },
    });
    const png = resvg.render().asPng();
    return png && png.length > 0 ? Buffer.from(png) : null;
  } catch (error) {
    console.warn(`Social card PNG render failed; keeping SVG fallback: ${error.message}`);
    return null;
  }
}
