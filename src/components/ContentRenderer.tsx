import { Icon } from '@iconify/react';
import { div as MotionDiv } from 'framer-motion/m';
import { useLocation } from 'react-router-dom';
import { useMemo, memo, type ReactNode } from 'react';

import { getContentCollection } from '../data/collections';
import { findPageTags } from '../lib/navigation';
import { parseCollectionRoutePath } from '../../shared/docsRouting.js';
import type { ContentCollection } from '../../shared/docsRouting.js';
import { useAdjacentPageNavigation } from '../hooks/useAdjacentPageNavigation';
import { prefetchDocument } from '../lib/content';

import DocPageFooter from './DocPageFooter';
import MarkdownRenderer, { HtmlRenderer } from './MarkdownRenderer';

type ContentRendererProps = {
  content: string;
  path: string;
  sourcePath?: string;
  contentFormat?: 'markdown' | 'html' | 'mdx';
  trailingContent?: ReactNode;
  collection?: ContentCollection;
};

const ContentRenderer = memo(function ContentRenderer({
  content = '',
  path = '',
  sourcePath,
  contentFormat = 'markdown',
  trailingContent,
  collection,
}: ContentRendererProps) {
  const location = useLocation();
  const activeCollection = collection || getContentCollection('docs');
  const routePrefix =
    String(activeCollection.routePrefix || '/docs').replace(/\/+$/, '') || '/docs';
  const docsRouteSlug = location.pathname.startsWith(routePrefix)
    ? location.pathname.replace(new RegExp(`^${routePrefix}/?`), '')
    : '';
  const routeContext = useMemo(
    () => parseCollectionRoutePath(activeCollection, docsRouteSlug),
    [activeCollection, docsRouteSlug]
  );

  const {
    prev: prevPage,
    next: nextPage,
    goToPage,
  } = useAdjacentPageNavigation({
    path,
    version: routeContext.activeVersion,
    locale: routeContext.activeLocale,
    collection: activeCollection,
  });
  const pageTags = useMemo(
    () => findPageTags(path, activeCollection.tree),
    [activeCollection.tree, path]
  );
  const isSynopsisPage = useMemo(() => path.toLowerCase().includes('synopsis'), [path]);

  const warmPage = (targetPath?: string) => {
    if (!targetPath) {
      return;
    }

    prefetchDocument(
      targetPath,
      {
        version: routeContext.activeVersion,
        locale: routeContext.activeLocale,
      },
      activeCollection.id
    );
  };

  return (
    <div className="w-full h-full overflow-hidden" role="article">
      <div className="flex-1 overflow-y-auto doc-content-scroll h-full">
        <div className="doc-content-shell flex min-h-full flex-col">
          <div className="doc-content doc-content-body flex-1 w-full max-w-4xl mx-auto pt-8 px-6 md:pt-12 md:px-8 lg:pt-16 lg:px-12">
            {isSynopsisPage && (
              <div className="w-full mb-6 overflow-hidden rounded-lg relative">
                <div
                  className="w-full h-32 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.08), rgba(var(--primary-color-rgb), 0.18))',
                    border: '1px solid var(--border-unified)',
                  }}
                >
                  <span className="text-xl font-bold" style={{ color: 'var(--papers-text-color)' }}>
                    Documentation
                  </span>
                </div>
              </div>
            )}

            {contentFormat === 'html' ? (
              <HtmlRenderer html={content} />
            ) : (
              <MarkdownRenderer content={content} path={path} />
            )}

            {trailingContent}

            {pageTags.length > 0 && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8 mb-4 flex flex-wrap gap-2 items-center"
              >
                <span
                  className="text-xs font-medium mr-2"
                  style={{
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--mono-font)',
                  }}
                >
                  tags:
                </span>
                {pageTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all hover:brightness-110"
                    style={{
                      backgroundColor: 'var(--tag-bg-color)',
                      color: 'var(--tag-text-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    <Icon icon="mingcute:tag-line" className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </MotionDiv>
            )}
          </div>

          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="doc-page-bottom doc-page-bottom--anchored mt-auto w-full max-w-4xl mx-auto pt-0 pb-6 px-6 md:pb-8 md:px-8 lg:pb-12 lg:px-12"
          >
            {/* Row 1: adjacent docs — always in document flow under the article */}
            <nav className="doc-page-bottom-row" aria-label="Adjacent documentation pages">
              <div className="doc-page-bottom-nav doc-page-bottom-nav--prev">
                {prevPage ? (
                  <button
                    onClick={() => goToPage(prevPage)}
                    onMouseEnter={() => warmPage(prevPage.path)}
                    onFocus={() => warmPage(prevPage.path)}
                    className="nav-button rounded-lg p-4 text-left transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="mb-1 text-xs" style={{ color: 'var(--muted-color)' }}>
                      Previous
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--papers-text-color)' }}
                    >
                      {prevPage.title}
                    </div>
                  </button>
                ) : null}
              </div>

              <div className="doc-page-bottom-nav doc-page-bottom-nav--next">
                {nextPage ? (
                  <button
                    onClick={() => goToPage(nextPage)}
                    onMouseEnter={() => warmPage(nextPage.path)}
                    onFocus={() => warmPage(nextPage.path)}
                    className="nav-button rounded-lg p-4 text-right transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="mb-1 text-xs" style={{ color: 'var(--muted-color)' }}>
                      Next
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--papers-text-color)' }}
                    >
                      {nextPage.title}
                    </div>
                  </button>
                ) : null}
              </div>
            </nav>

            {/* Row 2: edit / issue / source (GitHub) — in flow, not absolute-positioned */}
            <DocPageFooter path={path} sourcePath={sourcePath} />
          </MotionDiv>
        </div>
      </div>
    </div>
  );
});

export default ContentRenderer;
