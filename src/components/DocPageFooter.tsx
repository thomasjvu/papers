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
  const issueUrl = `${githubUrl}/issues/new?title=${encodeURIComponent(`Docs: ${path}`)}&body=${encodeURIComponent(`Page: ${path}\nSource: ${githubSourcePath}\n\nWhat should change?\n`)}`;

  return (
    <footer className="doc-page-footer mt-8 pt-4">
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <p className="doc-page-footer-label">Edit this page</p>
          <pre className="doc-page-footer-path" title={githubSourcePath}>
            <code>{githubSourcePath}</code>
          </pre>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-page-footer-action"
          >
            <Icon icon="mingcute:edit-2-line" className="h-3.5 w-3.5" />
            Edit on GitHub
          </a>

          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-page-footer-action doc-page-footer-action--muted"
          >
            <Icon icon="mingcute:bug-line" className="h-3.5 w-3.5" />
            Report issue
          </a>
        </div>
      </div>
    </footer>
  );
}
