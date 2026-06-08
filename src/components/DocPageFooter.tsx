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
  const sourceUrl = `${githubUrl}/blob/${githubBranch}/${githubSourcePath}`;
  const issueUrl = `${githubUrl}/issues/new?title=${encodeURIComponent(`Docs: ${path}`)}&body=${encodeURIComponent(`Page: ${path}\nSource: ${githubSourcePath}\n\nWhat should change?\n`)}`;

  return (
    <footer className="doc-page-footer">
      <nav className="doc-page-footer-links" aria-label="Edit this page">
        <a href={editUrl} target="_blank" rel="noopener noreferrer" className="doc-page-footer-link">
          edit
        </a>
        <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="doc-page-footer-link">
          issue
        </a>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="doc-page-footer-link">
          source
        </a>
      </nav>
    </footer>
  );
}