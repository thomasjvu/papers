import { Icon } from '@iconify/react';
import { domAnimation, LazyMotion } from 'framer-motion';
import { div as MotionDiv } from 'framer-motion/m';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ColorPalette from '../components/ColorPalette';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { designBookConfig } from '../../shared/documentation-config.js';
import { applySeoMetadata } from '../utils/seo';

type DesignBookPayload = {
  name: string;
  description?: string;
  version?: string;
  title?: string;
  subtitle?: string;
  body: string;
  tokens: {
    colors: Array<{ name: string; hex: string; rgb: string; usage: string }>;
    typography: Array<Record<string, string>>;
    rounded: Record<string, string>;
    spacing: Record<string, string | number>;
    components: Record<string, Record<string, string>>;
  };
};

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function DesignBookPage() {
  const [book, setBook] = useState<DesignBookPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designBookConfig.enabled) {
      return;
    }

    fetch('/design-book.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Design book artifact missing. Run npm run generate:design-book.');
        }
        return response.json();
      })
      .then((payload) => setBook(payload))
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load design book');
      });
  }, []);

  const pageTitle = useMemo(
    () => book?.title || designBookConfig.title || 'Design Book',
    [book?.title]
  );

  useEffect(() => {
    applySeoMetadata({
      title: `${SITE_NAME} | ${pageTitle}`,
      description: book?.description || designBookConfig.subtitle || 'Project design system',
      path: designBookConfig.route || '/design',
      canonicalPath: designBookConfig.route || '/design',
      type: 'article',
    });
  }, [book?.description, pageTitle]);

  if (!designBookConfig.enabled) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ color: 'var(--text-color)' }}
      >
        <p>
          Design book is disabled. Set `designBookConfig.enabled` in shared/documentation-config.js.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ color: 'var(--error-color)' }}
      >
        <p>{error}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ color: 'var(--muted-color)' }}
      >
        <p>Loading design book…</p>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="design-book-page min-h-screen"
        style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}
      >
        <header
          className="design-book-hero border-b px-6 py-10 md:px-10 md:py-14"
          style={{ borderColor: 'var(--border-unified)' }}
        >
          <div className="mx-auto flex max-w-[var(--design-book-max-width,72rem)] flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: 'var(--muted-color)' }}
              >
                <Icon icon="mingcute:arrow-left-line" width={18} />
                Back to docs
              </Link>
              <span
                className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em]"
                style={{
                  background: 'var(--hover-color)',
                  color: 'var(--accent-color)',
                  border: '1px solid var(--border-unified)',
                }}
              >
                DESIGN.md · {book.version || 'alpha'}
              </span>
            </div>

            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <div>
                <p
                  className="mb-3 text-xs uppercase tracking-[0.2em]"
                  style={{ color: 'var(--muted-color)' }}
                >
                  {book.subtitle || designBookConfig.subtitle}
                </p>
                <h1 className="design-book-section-title m-0 text-4xl md:text-5xl">{book.name}</h1>
                {book.description ? (
                  <p
                    className="mt-4 max-w-2xl text-base md:text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {book.description}
                  </p>
                ) : null}
              </div>
              <div className="design-book-token-card p-5">
                <div
                  className="text-xs uppercase tracking-[0.16em]"
                  style={{ color: 'var(--muted-color)' }}
                >
                  Token summary
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt style={{ color: 'var(--muted-color)' }}>Colors</dt>
                    <dd className="text-2xl font-semibold">{book.tokens.colors.length}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted-color)' }}>Type styles</dt>
                    <dd className="text-2xl font-semibold">{book.tokens.typography.length}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted-color)' }}>Radii</dt>
                    <dd className="text-2xl font-semibold">
                      {Object.keys(book.tokens.rounded).length}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted-color)' }}>Components</dt>
                    <dd className="text-2xl font-semibold">
                      {Object.keys(book.tokens.components).length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[var(--design-book-max-width,72rem)] px-6 py-10 md:px-10 md:py-14">
          {book.tokens.colors.length > 0 ? (
            <section className="mb-14">
              <h2 className="design-book-section-title mb-2 text-2xl">Color palette</h2>
              <p className="mb-6 text-sm" style={{ color: 'var(--muted-color)' }}>
                Machine-readable tokens from DESIGN.md front matter.
              </p>
              <ColorPalette colors={book.tokens.colors} />
            </section>
          ) : null}

          {book.tokens.typography.length > 0 ? (
            <section className="mb-14">
              <h2 className="design-book-section-title mb-6 text-2xl">Typography</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {book.tokens.typography.map((style) => (
                  <div key={style.name} className="design-book-token-card p-5">
                    <div
                      className="text-xs uppercase tracking-[0.14em]"
                      style={{ color: 'var(--muted-color)' }}
                    >
                      {style.name}
                    </div>
                    <div
                      className="mt-3"
                      style={{
                        fontFamily: style.fontFamily || 'var(--body-font)',
                        fontSize: style.fontSize || '1rem',
                        fontWeight: style.fontWeight || 400,
                        lineHeight: style.lineHeight || 1.5,
                        letterSpacing: style.letterSpacing || 'normal',
                      }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </div>
                    <pre
                      className="mt-4 overflow-x-auto rounded-lg p-3 text-xs"
                      style={{ background: 'var(--code-bg)', color: 'var(--text-secondary)' }}
                    >
                      {JSON.stringify(style, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {(Object.keys(book.tokens.rounded).length > 0 ||
            Object.keys(book.tokens.spacing).length > 0) && (
            <section className="mb-14 grid gap-4 md:grid-cols-2">
              {Object.keys(book.tokens.rounded).length > 0 ? (
                <div className="design-book-token-card p-5">
                  <h3 className="design-book-section-title m-0 text-xl">Rounded</h3>
                  <ul className="mt-4 space-y-3">
                    {Object.entries(book.tokens.rounded).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-4 text-sm">
                        <span
                          className="design-book-swatch h-10 w-16 shrink-0"
                          style={{ borderRadius: String(value), background: 'var(--accent-color)' }}
                        />
                        <span>
                          <strong>{key}</strong> — {String(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {Object.keys(book.tokens.spacing).length > 0 ? (
                <div className="design-book-token-card p-5">
                  <h3 className="design-book-section-title m-0 text-xl">Spacing</h3>
                  <ul className="mt-4 space-y-2 text-sm">
                    {Object.entries(book.tokens.spacing).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}</strong> — {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          )}

          {Object.keys(book.tokens.components).length > 0 ? (
            <section className="mb-14">
              <h2 className="design-book-section-title mb-6 text-2xl">Components</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(book.tokens.components).map(([name, props]) => (
                  <div key={name} className="design-book-token-card p-5">
                    <div className="font-mono text-sm" style={{ color: 'var(--accent-color)' }}>
                      {name}
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      {Object.entries(props).map(([prop, value]) => (
                        <div key={prop} className="flex justify-between gap-4">
                          <dt style={{ color: 'var(--muted-color)' }}>{prop}</dt>
                          <dd className="text-right font-mono">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {book.body ? (
            <section
              className="design-book-prose border-t pt-10"
              style={{ borderColor: 'var(--border-unified)' }}
            >
              <h2 className="design-book-section-title mb-6 text-2xl">Design rationale</h2>
              <div className="doc-content max-w-none">
                <MarkdownRenderer content={book.body} path="design-book" />
              </div>
            </section>
          ) : null}
        </main>
      </MotionDiv>
    </LazyMotion>
  );
}
