import { useEffect, useState } from 'react';

import CodeBlock from './CodeBlock';
import { createLogger } from '../utils/logger';

const logger = createLogger('HostedFilePreview');

type HostedFilePreviewProps = {
  assetUrl: string;
  assetLabel: string;
};

export default function HostedFilePreview({ assetUrl, assetLabel }: HostedFilePreviewProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    void fetch(assetUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${assetLabel}: ${response.status}`);
        }

        return response.text();
      })
      .then((text) => {
        if (!active) {
          return;
        }

        setContent(text);
      })
      .catch((fetchError) => {
        if (!active) {
          return;
        }

        logger.error(`Error loading ${assetLabel}:`, fetchError);
        setError(fetchError instanceof Error ? fetchError.message : `Failed to load ${assetLabel}`);
        setContent('');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [assetLabel, assetUrl]);

  if (loading) {
    return (
      <div className="doc-hosted-preview doc-hosted-preview--loading">
        <div className="animate-pulse text-sm" style={{ color: 'var(--muted-color)' }}>
          Loading {assetLabel} preview...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-hosted-preview doc-hosted-preview--error">
        <p className="text-sm" style={{ color: 'var(--error-color)' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="doc-hosted-preview">
      <CodeBlock
        snippets={[{ language: 'markdown', code: content, label: assetLabel }]}
        showLineNumbers={true}
      />
    </div>
  );
}