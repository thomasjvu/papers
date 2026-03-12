import { useState, useEffect } from 'react';

import DocumentationPage from '../components/docs/DocumentationPage';
import { getDocument } from '../lib/content';
import { createLogger } from '../utils/logger';
import { applySeoMetadata } from '../utils/seo';
import { extractDescriptionFromMarkdown } from '../../shared/seo.js';

const logger = createLogger('LLMSPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function LLMSPage() {
  const [content, setContent] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sourcePath, setSourcePath] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const [doc, llmsResponse] = await Promise.all([getDocument('llms'), fetch('/llms.txt')]);

        let mdContent = doc?.content || '# LLMs.txt\n\nContent not found.';
        const nextDescription =
          doc?.description ||
          extractDescriptionFromMarkdown(doc?.content || mdContent) ||
          'AI-friendly text exports generated from the documentation corpus.';

        if (llmsResponse.ok) {
          const llmsContent = await llmsResponse.text();
          mdContent = mdContent.replace('{llms-preview}', llmsContent);
        } else {
          mdContent = mdContent.replace('{llms-preview}', '# llms.txt content will appear here');
        }

        setDescription(nextDescription);
        setContent(mdContent);
        setSourcePath(doc?.sourcePath);
      } catch (error) {
        logger.error('Error loading LLMS page content:', error);
        const fallbackContent = '# Error\n\nFailed to load content.';
        setContent(fallbackContent);
        setDescription(extractDescriptionFromMarkdown(fallbackContent));
        setSourcePath(undefined);
      } finally {
        setLoading(false);
      }
    }

    void loadContent();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    applySeoMetadata({
      title: `LLMs.txt | ${SITE_NAME}`,
      description: description || 'AI-friendly text exports generated from the documentation corpus.',
      path: '/llms',
      canonicalPath: '/llms',
      type: 'article',
    });
  }, [description, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-color">Loading...</div>
      </div>
    );
  }

  return <DocumentationPage initialContent={content} currentPath="llms" sourcePath={sourcePath} />;
}
