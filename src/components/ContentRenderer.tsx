import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, memo } from 'react';

import { documentationTree } from '../data/documentation';
import { findAdjacentPages, findPageTags } from '../lib/navigation';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';

import DocPageFooter from './DocPageFooter';
import MarkdownRenderer from './MarkdownRenderer';

type ContentRendererProps = {
  content: string;
  path: string;
  sourcePath?: string;
};

const ContentRenderer = memo(function ContentRenderer({
  content = '',
  path = '',
  sourcePath,
}: ContentRendererProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const docsRouteSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : '';
  const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);

  const { prev: prevPage, next: nextPage } = useMemo(
    () => findAdjacentPages(path, documentationTree),
    [path]
  );
  const pageTags = useMemo(() => findPageTags(path, documentationTree), [path]);
  const isSynopsisPage = useMemo(() => path.toLowerCase().includes('synopsis'), [path]);

  return (
    <div className="w-full h-full overflow-hidden" role="article">
      <div className="flex-1 overflow-y-auto doc-content-scroll h-full">
        <div className="doc-content pt-8 pb-6 px-6 md:pt-12 md:pb-8 md:px-8 lg:pt-16 lg:pb-12 lg:px-12 max-w-4xl mx-auto">
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
                <span className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                  Documentation
                </span>
              </div>
            </div>
          )}

          <MarkdownRenderer content={content} path={path} />

          {pageTags.length > 0 && (
            <motion.div
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
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="doc-page-bottom mt-12 border-t pt-4"
            style={{ borderColor: 'var(--border-unified)' }}
          >
            <div className="doc-page-bottom-row">
              <div className="doc-page-bottom-nav doc-page-bottom-nav--prev">
                {prevPage ? (
                  <button
                    onClick={() =>
                      navigate(
                        buildCanonicalDocsPath(prevPage.path, {
                          version: routeContext.activeVersion,
                          locale: routeContext.activeLocale,
                        })
                      )
                    }
                    className="nav-button text-left rounded-lg p-4 transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="mb-1 text-xs" style={{ color: 'var(--muted-color)' }}>
                      Previous
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {prevPage.title}
                    </div>
                  </button>
                ) : null}
              </div>

              <DocPageFooter path={path} sourcePath={sourcePath} />

              <div className="doc-page-bottom-nav doc-page-bottom-nav--next">
                {nextPage ? (
                  <button
                    onClick={() =>
                      navigate(
                        buildCanonicalDocsPath(nextPage.path, {
                          version: routeContext.activeVersion,
                          locale: routeContext.activeLocale,
                        })
                      )
                    }
                    className="nav-button rounded-lg p-4 text-right transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="mb-1 text-xs" style={{ color: 'var(--muted-color)' }}>
                      Next
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {nextPage.title}
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default ContentRenderer;
