import { Navigate, useLocation } from 'react-router-dom';

import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';

type HostedAssetRedirectPageProps = {
  docPath: 'llms' | 'skill';
};

export default function HostedAssetRedirectPage({ docPath }: HostedAssetRedirectPageProps) {
  const location = useLocation();
  const target = buildCanonicalDocsPath(docPath);

  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}