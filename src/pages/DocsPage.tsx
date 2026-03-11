import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import DocumentationPage from '../components/docs/DocumentationPage';
import { getDocument, resolveDocumentPath } from '../lib/content';
import { createLogger } from '../utils/logger';

const logger = createLogger('DocsPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function DocsPage() {
  const params = useParams();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Documentation');

  const slug = params['*'] || '';
  const docPath = useMemo(() => resolveDocumentPath(slug), [slug]);

  useEffect(() => {
    let active = true;

    setLoading(true);

    void getDocument(docPath)
      .then((doc) => {
        if (!active) {
          return;
        }

        if (doc) {
          setContent(doc.content);
          setCurrentDocPath(docPath);
          setDocTitle(doc.title);
          return;
        }

        setContent('# Not Found\n\nThe requested documentation page could not be found.');
        setCurrentDocPath(docPath);
        setDocTitle('Not Found');
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        logger.error('Error loading document:', error);
        setContent('# Error\n\nFailed to load documentation.');
        setCurrentDocPath(docPath);
        setDocTitle('Error');
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
  }, [docPath]);

  useEffect(() => {
    document.title = `${docTitle} | ${SITE_NAME}`;
  }, [docTitle]);

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
      isLoading={loading}
      pendingPath={docPath}
    />
  );
}
