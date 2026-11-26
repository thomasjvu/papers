import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { domAnimation, LazyMotion } from 'framer-motion';

import DocumentationPage from '../components/docs/DocumentationPage';
import NotFoundPage from './NotFoundPage';
import {
  getDocument,
  getDocumentBacklinks,
  resolveDocumentPath,
  type DocumentBacklink,
  type InitialDocsData,
} from '../lib/content';
import { getContentCollection } from '../data/collections';
import { createLogger } from '../utils/logger';
import { applySeoMetadata } from '../utils/seo';
import {
  buildCanonicalCollectionPath,
  parseCollectionRoutePath,
} from '../../shared/docsRouting.js';
import { extractDescriptionFromMarkdown } from '../../shared/seo.js';
import DocumentBacklinks from '../components/docs/DocumentBacklinks';

const logger = createLogger('DocsPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function DocsPage({
  collectionId = 'docs',
  initialDocs,
}: {
  collectionId?: string;
  initialDocs?: InitialDocsData;
}) {
  const collection = useMemo(() => getContentCollection(collectionId), [collectionId]);
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const slug = params['*'] || '';
  const routeContext = useMemo(
    () => parseCollectionRoutePath(collection, slug),
    [collection, slug]
  );
  const docPath = useMemo(
    () => resolveDocumentPath(routeContext.docPath, collection.tree),
    [collection.tree, routeContext.docPath]
  );
  const canonicalPath = useMemo(
    () =>
      buildCanonicalCollectionPath(collection, docPath, {
        version: routeContext.activeVersion,
        locale: routeContext.activeLocale,
      }),
    [collection, docPath, routeContext.activeLocale, routeContext.activeVersion]
  );

  const matchedInitial =
    initialDocs &&
    initialDocs.collectionId === collection.id &&
    initialDocs.docPath === docPath &&
    (initialDocs.version ?? null) === (routeContext.activeVersion ?? null) &&
    (initialDocs.locale ?? null) === (routeContext.activeLocale ?? null)
      ? initialDocs
      : null;
  const requestKey = `${collection.id}:${docPath}:${routeContext.activeVersion ?? ''}:${
    routeContext.activeLocale ?? ''
  }`;
  const loadedKeyRef = useRef<string | null>(matchedInitial ? requestKey : null);

  const [content, setContent] = useState<string>(matchedInitial?.document.content ?? '');
  const [status, setStatus] = useState<
    'initial-loading' | 'refreshing' | 'ready' | 'not-found' | 'error'
  >(matchedInitial ? 'ready' : 'initial-loading');
  const loading = status === 'initial-loading' || status === 'refreshing';
  const hasLoadedOnce = status !== 'initial-loading';
  const isNotFound = status === 'not-found';
  const [currentDocPath, setCurrentDocPath] = useState<string>(matchedInitial ? docPath : '');
  const [docTitle, setDocTitle] = useState<string>(
    matchedInitial?.document.title ?? 'Documentation'
  );
  const [docDescription, setDocDescription] = useState<string>(
    matchedInitial?.document.description ?? ''
  );
  const [docSourcePath, setDocSourcePath] = useState<string | undefined>(
    matchedInitial?.document.sourcePath
  );
  const [docContentFormat, setDocContentFormat] = useState<'markdown' | 'html'>(
    matchedInitial?.document.contentFormat || 'markdown'
  );
  const [backlinks, setBacklinks] = useState<DocumentBacklink[]>(matchedInitial?.backlinks ?? []);

  useEffect(() => {
    const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/';
    const normalizedCanonicalPath = canonicalPath.replace(/\/+$/, '') || '/';

    if (normalizedCurrentPath !== normalizedCanonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [canonicalPath, location.pathname, navigate]);

  useEffect(() => {
    if (loadedKeyRef.current === requestKey) {
      return undefined;
    }
    loadedKeyRef.current = requestKey;

    let active = true;

    setStatus((previous) => (previous === 'initial-loading' ? 'initial-loading' : 'refreshing'));
    setBacklinks([]);

    void Promise.all([
      getDocument(
        docPath,
        {
          version: routeContext.activeVersion,
          locale: routeContext.activeLocale,
        },
        collection.id
      ),
      getDocumentBacklinks(docPath, collection.id),
    ])
      .then(([doc, nextBacklinks]) => {
        if (!active) {
          return;
        }

        if (doc) {
          setContent(doc.content);
          setCurrentDocPath(docPath);
          setDocTitle(doc.title);
          setDocDescription(doc.description || extractDescriptionFromMarkdown(doc.content));
          setDocSourcePath(doc.sourcePath);
          setDocContentFormat(doc.contentFormat || 'markdown');
          setBacklinks(nextBacklinks);
          setStatus('ready');
          return;
        }

        setStatus('not-found');
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
        setDocContentFormat('markdown');
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [collection.id, docPath, requestKey, routeContext.activeLocale, routeContext.activeVersion]);

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

  if (hasLoadedOnce && isNotFound) {
    return <NotFoundPage />;
  }

  return (
    <LazyMotion features={domAnimation}>
      <DocumentationPage
        initialContent={content}
        currentPath={currentDocPath || docPath}
        sourcePath={docSourcePath}
        contentFormat={docContentFormat}
        trailingContent={<DocumentBacklinks backlinks={backlinks} />}
        isLoading={loading}
        pendingPath={docPath}
        collection={collection}
      />
    </LazyMotion>
  );
}
