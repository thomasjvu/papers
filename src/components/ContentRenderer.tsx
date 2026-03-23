import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, memo } from 'react';

import { documentationTree } from '../data/documentation';
import { findAdjacentPages, findPageTags } from '../lib/navigation';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';

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

  const githubBranch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
  const githubSourcePath = sourcePath || `src/docs/content/${path}.md`;

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

          {(prevPage || nextPage) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-12 pt-4 border-t"
              style={{ borderColor: 'var(--border-unified)' }}
            >
              <div className="pagination-links">
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
                    className="nav-button text-left p-4 rounded-lg transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="text-xs mb-1" style={{ color: 'var(--muted-color)' }}>
                      Previous
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {prevPage.title}
                    </div>
                  </button>
                ) : (
                  <div></div>
                )}

                {nextPage && (
                  <button
                    onClick={() =>
                      navigate(
                        buildCanonicalDocsPath(nextPage.path, {
                          version: routeContext.activeVersion,
                          locale: routeContext.activeLocale,
                        })
                      )
                    }
                    className="nav-button text-right p-4 rounded-lg transition-opacity hover:opacity-70"
                    type="button"
                  >
                    <div className="text-xs mb-1" style={{ color: 'var(--muted-color)' }}>
                      Next
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {nextPage.title}
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-4 pt-4 border-t"
            style={{ borderColor: 'var(--border-unified)' }}
          >
            <div className="flex flex-wrap gap-3 justify-center items-center">
              {import.meta.env.VITE_GITHUB_URL && (
                <>
                  <a
                    href={`${import.meta.env.VITE_GITHUB_URL}/edit/${githubBranch}/${githubSourcePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                    style={{ fontFamily: 'var(--mono-font)', color: 'var(--muted-color)' }}
                  >
                    <Icon icon="mingcute:edit-2-line" className="w-3.5 h-3.5" />
                    <span>edit</span>
                  </a>

                  <a
                    href={`${import.meta.env.VITE_GITHUB_URL}/issues/new?title=Issue with ${encodeURIComponent(path)}&body=${encodeURIComponent(`I found an issue with the documentation page: ${path}\n\nDescription:\n`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                    style={{ fontFamily: 'var(--mono-font)', color: 'var(--muted-color)' }}
                  >
                    <Icon icon="mingcute:bug-line" className="w-3.5 h-3.5" />
                    <span>issue</span>
                  </a>

                  <a
                    href={`${import.meta.env.VITE_GITHUB_URL}/blob/${githubBranch}/${githubSourcePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                    style={{ fontFamily: 'var(--mono-font)', color: 'var(--muted-color)' }}
                  >
                    <Icon icon="mingcute:code-line" className="w-3.5 h-3.5" />
                    <span>source</span>
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default ContentRenderer;
