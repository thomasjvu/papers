import { Icon } from '@iconify/react';

type DocPageFooterProps = {
  path: string;
  sourcePath?: string;
};

export default function DocPageFooter({ path, sourcePath }: DocPageFooterProps) {
  const githubUrl = import.meta.env.VITE_GITHUB_URL;
  if (!githubUrl) {
    return null;
  }

  const githubBranch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
  const githubDocsPrefix = import.meta.env.VITE_GITHUB_DOCS_PREFIX || '';
  const relativeSource = sourcePath || `src/docs/content/${path}.md`;
  const githubSourcePath = `${githubDocsPrefix}${relativeSource}`.replace(/\/{2,}/g, '/');
  const editUrl = `${githubUrl}/edit/${githubBranch}/${githubSourcePath}`;
  const viewUrl = `${githubUrl}/blob/${githubBranch}/${githubSourcePath}`;
  const issueUrl = `${githubUrl}/issues/new?title=${encodeURIComponent(`Docs: ${path}`)}&body=${encodeURIComponent(`Page: ${path}\nSource: ${githubSourcePath}\n\nWhat should change?\n`)}`;

  return (
    <footer
      className="doc-page-footer mt-10 pt-5 border-t"
      style={{ borderColor: 'var(--border-unified)' }}
    >
      <div
        className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{
          backgroundColor: 'var(--card-color)',
          borderColor: 'var(--border-unified)',
        }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
            Edit this page
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
          >
            {githubSourcePath}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-unified)',
              color: 'var(--text-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            <Icon icon="mingcute:edit-2-line" className="h-3.5 w-3.5" />
            Edit on GitHub
          </a>

          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-unified)',
              color: 'var(--muted-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            <Icon icon="mingcute:code-line" className="h-3.5 w-3.5" />
            View source
          </a>

          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-unified)',
              color: 'var(--muted-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            <Icon icon="mingcute:bug-line" className="h-3.5 w-3.5" />
            Report issue
          </a>
        </div>
      </div>
    </footer>
  );
}
