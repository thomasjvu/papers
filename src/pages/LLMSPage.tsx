import { useState, useEffect } from 'react';

import DocumentationPage from '../components/docs/DocumentationPage';
import { getDocument } from '../lib/content';
import { createLogger } from '../utils/logger';

const logger = createLogger('LLMSPage');
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function LLMSPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `LLMs.txt | ${SITE_NAME}`;
  }, []);

  useEffect(() => {
    async function loadContent() {
      try {
        const [doc, llmsResponse] = await Promise.all([getDocument('llms'), fetch('/llms.txt')]);

        let mdContent = doc?.content || '# LLMs.txt\n\nContent not found.';

        if (llmsResponse.ok) {
          const llmsContent = await llmsResponse.text();
          mdContent = mdContent.replace('{llms-preview}', llmsContent);
        } else {
          mdContent = mdContent.replace('{llms-preview}', '# llms.txt content will appear here');
        }

        setContent(mdContent);
      } catch (error) {
        logger.error('Error loading LLMS page content:', error);
        setContent('# Error\n\nFailed to load content.');
      } finally {
        setLoading(false);
      }
    }

    void loadContent();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-color">Loading...</div>
      </div>
    );
  }

  return <DocumentationPage initialContent={content} currentPath="llms" />;
}
