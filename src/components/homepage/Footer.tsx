import { Link } from 'react-router-dom';

interface FooterLink {
  text: string;
  href: string;
}

interface FooterProps {
  footer: {
    brandName?: string;
    tagline?: string;
    links: FooterLink[];
  };
}

export function Footer({ footer }: FooterProps) {
  const siteName = import.meta.env.VITE_SITE_NAME || footer.brandName || 'Documentation';
  const brandName = footer.brandName || siteName;
  const tagline = footer.tagline || 'Documentation';

  return (
    <footer className="py-8 border-t" style={{ borderColor: 'var(--border-unified)' }}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'var(--title-font)', color: 'var(--primary-color)' }}
            >
              {brandName}
            </span>
            <span style={{ color: 'var(--muted-color)' }}>{tagline}</span>
          </div>

          <div className="flex items-center gap-6">
            {footer.links.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.text}
                  to={link.href}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--muted-color)' }}
                >
                  {link.text}
                </Link>
              ) : (
                <a
                  key={link.text}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--muted-color)' }}
                >
                  {link.text}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
