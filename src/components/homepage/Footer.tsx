import { Link } from 'react-router-dom';

interface FooterLink {
  text: string;
  href: string;
}

interface FooterProps {
  footer: {
    links: FooterLink[];
  };
}

export function Footer({ footer }: FooterProps) {
  return (
    <footer className="py-8 border-t" style={{ borderColor: 'var(--border-unified)' }}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'var(--mono-font)', color: 'var(--primary-color)' }}
            >
              papers
            </span>
            <span style={{ color: 'var(--muted-color)' }}>
              — Open Source Documentation Framework
            </span>
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
