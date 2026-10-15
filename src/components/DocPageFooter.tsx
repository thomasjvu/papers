import { useUiStrings } from '../lib/uiStrings';

type DocPageFooterProps = {
  path: string;
  sourcePath?: string;
};

/**
 * Bottom-of-page GitHub affordances for every doc.
 * Renders nothing when VITE_GITHUB_URL is unset (links would be broken).
 */
export default function DocPageFooter({ path, sourcePath }: DocPageFooterProps) {
  const ui = useUiStrings();
  const githubUrl = import.meta.env.VITE_GITHUB_URL?.trim();
  if (!githubUrl) {
    return null;
  }

  const githubBranch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
  const githubDocsPrefix = import.meta.env.VITE_GITHUB_DOCS_PREFIX || '';
  const relativeSource = sourcePath || `src/docs/content/${path}.md`;
  const githubSourcePath = `${githubDocsPrefix}${relativeSource}`.replace(/\/{2,}/g, '/');
  const editUrl = `${githubUrl}/edit/${githubBranch}/${githubSourcePath}`;
  const sourceUrl = `${githubUrl}/blob/${githubBranch}/${githubSourcePath}`;
  const issueUrl = `${githubUrl}/issues/new?title=${encodeURIComponent(`Docs: ${path}`)}&body=${encodeURIComponent(`Page: ${path}\nSource: ${githubSourcePath}\n\nWhat should change?\n`)}`;

  return (
    <footer className="doc-page-footer">
      <nav className="doc-page-footer-links" aria-label={ui.pageSourceActions}>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-page-footer-link"
          aria-label={`Edit ${path} on GitHub`}
        >
          {ui.edit}
        </a>
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-page-footer-link"
          aria-label={`Open a GitHub issue about ${path}`}
        >
          {ui.issue}
        </a>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-page-footer-link"
          aria-label={`View source for ${path} on GitHub`}
        >
          {ui.source}
        </a>
      </nav>
    </footer>
  );
}
