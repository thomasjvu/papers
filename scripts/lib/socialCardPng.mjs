import { existsSync } from 'fs';
import { join } from 'path';

const CARD_FONT_FILES = ['Mona-Sans.ttf', 'Hubot-Sans.ttf'];

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

export function socialCardFontFiles(publicDir) {
  return CARD_FONT_FILES.map((file) => join(publicDir, 'fonts', file)).filter((file) =>
    existsSync(file)
  );
}

/**
 * The bundled Mona/Hubot Sans files are variable fonts whose default instance is
 * ExtraLight (wght 200), and resvg renders only the default instance. The OFL
 * Reserved Font Name forbids shipping renamed static instances, so emulate the
 * requested weight with a same-colour stroke painted behind the glyph fill.
 */
export function emboldenSvgText(svg) {
  return String(svg).replace(/<text\b([^>]*)>/g, (tag, attributes) => {
    if (/\sstroke=/.test(attributes)) return tag;
    const fill = attributes.match(/\sfill="(#[0-9A-Fa-f]{3,8})"/)?.[1];
    if (!fill) return tag;
    const weight = Number(attributes.match(/\sfont-weight="(\d{3})"/)?.[1] || 400);
    const strokeWidth = Math.max(0.6, Math.min(3.2, (weight - 200) / 200)).toFixed(1);
    return `<text${attributes} stroke="${fill}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke">`;
  });
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
    const resvg = new Resvg(emboldenSvgText(svg), {
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
