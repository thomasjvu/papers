import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';

import DocumentationPage from '../components/docs/DocumentationPage';
import { getDocument, resolveDocumentPath } from '../lib/content';
import { createLogger } from '../utils/logger';

const logger = createLogger('DocsPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function DocsPage() {
  const params = useParams();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Documentation');
  const isInitialMount = useRef(true);

  const slug = params['*'] || '';
  const docPath = useMemo(() => resolveDocumentPath(slug), [slug]);

  useEffect(() => {
    if (docPath === currentDocPath && !isInitialMount.current) {
      return;
    }

    isInitialMount.current = false;
    setLoading(true);

    getDocument(docPath)
      .then((doc) => {
        if (doc) {
          setContent(doc.content);
          setCurrentDocPath(docPath);
          setDocTitle(doc.title);
        } else {
          setContent('# Not Found\n\nThe requested documentation page could not be found.');
          setCurrentDocPath(docPath);
          setDocTitle('Not Found');
        }
      })
      .catch((error) => {
        logger.error('Error loading document:', error);
        setContent('# Error\n\nFailed to load documentation.');
        setDocTitle('Error');
      })
      .finally(() => setLoading(false));
  }, [docPath, currentDocPath]);

  useEffect(() => {
    document.title = `${docTitle} | ${SITE_NAME}`;
  }, [docTitle]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--muted-color)' }}>
          Loading documentation...
        </div>
      </div>
    );
  }

  return <DocumentationPage initialContent={content} currentPath={currentDocPath} />;
}
