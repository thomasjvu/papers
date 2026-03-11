import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = `Not Found | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
          404
        </h1>
        <p className="text-xl mb-8" style={{ color: 'var(--muted-color)' }}>
          Page not found
        </p>
        <Link
          to="/docs/getting-started/introduction"
          className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--card-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
          }}
        >
          Go to documentation
        </Link>
      </div>
    </div>
  );
}
