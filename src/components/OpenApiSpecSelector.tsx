import { Link, useLocation } from 'react-router-dom';

type OpenApiSpecConfig = {
  id: string;
  label: string;
  url: string;
  description?: string;
};

type OpenApiSpecSelectorProps = {
  specs: OpenApiSpecConfig[];
  activeSpecId: string;
  defaultSpecId: string;
  pagePath: string;
};

function buildSpecHref(specId: string, defaultSpecId: string, pagePath: string) {
  const basePath = `/docs/${pagePath}`;

  if (specId === defaultSpecId) {
    return basePath;
  }

  return `${basePath}/${specId}`;
}

export default function OpenApiSpecSelector({
  specs,
  activeSpecId,
  defaultSpecId,
  pagePath,
}: OpenApiSpecSelectorProps) {
  const location = useLocation();

  if (specs.length <= 1) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="OpenAPI specifications">
      {specs.map((spec) => {
        const href = buildSpecHref(spec.id, defaultSpecId, pagePath);
        const isActive = spec.id === activeSpecId;

        return (
          <Link
            key={spec.id}
            to={{ pathname: href, search: location.search }}
            role="tab"
            aria-selected={isActive}
            className="rounded-md border px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: isActive ? 'var(--primary-color)' : 'var(--border-unified)',
              color: isActive ? 'var(--primary-color)' : 'var(--muted-color)',
              backgroundColor: isActive ? 'var(--surface-color)' : 'transparent',
              fontFamily: 'var(--mono-font)',
            }}
          >
            {spec.label}
          </Link>
        );
      })}
    </div>
  );
}
