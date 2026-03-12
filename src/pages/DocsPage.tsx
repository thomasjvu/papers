import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import DocumentationPage from '../components/docs/DocumentationPage';
import { getDocument, resolveDocumentPath } from '../lib/content';
import { createLogger } from '../utils/logger';
import { applySeoMetadata } from '../utils/seo';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';
import { extractDescriptionFromMarkdown } from '../../shared/seo.js';

const logger = createLogger('DocsPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function DocsPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Documentation');
  const [docDescription, setDocDescription] = useState<string>('');
  const [docSourcePath, setDocSourcePath] = useState<string | undefined>(undefined);

  const slug = params['*'] || '';
  const routeContext = useMemo(() => parseDocsRoutePath(slug), [slug]);
  const docPath = useMemo(() => resolveDocumentPath(routeContext.docPath), [routeContext.docPath]);
  const canonicalPath = useMemo(
    () =>
      buildCanonicalDocsPath(docPath, {
        version: routeContext.activeVersion,
        locale: routeContext.activeLocale,
      }),
    [docPath, routeContext.activeLocale, routeContext.activeVersion]
  );

  useEffect(() => {
    const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/';
    const normalizedCanonicalPath = canonicalPath.replace(/\/+$/, '') || '/';

    if (normalizedCurrentPath !== normalizedCanonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [canonicalPath, location.pathname, navigate]);

  useEffect(() => {
    let active = true;

    setLoading(true);

    void getDocument(docPath, {
      version: routeContext.activeVersion,
      locale: routeContext.activeLocale,
    })
      .then((doc) => {
        if (!active) {
          return;
        }

        if (doc) {
          setContent(doc.content);
          setCurrentDocPath(docPath);
          setDocTitle(doc.title);
          setDocDescription(doc.description || extractDescriptionFromMarkdown(doc.content));
          setDocSourcePath(doc.sourcePath);
          return;
        }

        const notFoundContent = '# Not Found\n\nThe requested documentation page could not be found.';
        setContent(notFoundContent);
        setCurrentDocPath(docPath);
        setDocTitle('Not Found');
        setDocDescription(extractDescriptionFromMarkdown(notFoundContent));
        setDocSourcePath(undefined);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        logger.error('Error loading document:', error);
        const errorContent = '# Error\n\nFailed to load documentation.';
        setContent(errorContent);
        setCurrentDocPath(docPath);
        setDocTitle('Error');
        setDocDescription(extractDescriptionFromMarkdown(errorContent));
        setDocSourcePath(undefined);
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setLoading(false);
        setHasLoadedOnce(true);
      });

    return () => {
      active = false;
    };
  }, [docPath, routeContext.activeLocale, routeContext.activeVersion]);

  useEffect(() => {
    if (!docTitle) {
      return;
    }

    const noIndex = docTitle === 'Not Found' || docTitle === 'Error';

    applySeoMetadata({
      title: `${docTitle} | ${SITE_NAME}`,
      description:
        docDescription ||
        'Documentation for the current section of the papers static documentation template.',
      path: canonicalPath,
      canonicalPath,
      type: noIndex ? 'website' : 'article',
      noIndex,
    });
  }, [canonicalPath, docDescription, docTitle]);

  if (!hasLoadedOnce && loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--muted-color)' }}>
          Loading documentation...
        </div>
      </div>
    );
  }

  return (
    <DocumentationPage
      initialContent={content}
      currentPath={currentDocPath || docPath}
      sourcePath={docSourcePath}
      isLoading={loading}
      pendingPath={docPath}
    />
  );
}