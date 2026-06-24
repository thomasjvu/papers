import { Navigate, useLocation } from 'react-router-dom';

import { getContentCollection } from '../data/collections';
import { buildCanonicalCollectionPath } from '../../shared/docsRouting.js';

type HostedAssetRedirectPageProps = {
  docPath: 'llms' | 'skill';
};

export default function HostedAssetRedirectPage({ docPath }: HostedAssetRedirectPageProps) {
  const location = useLocation();
  const collection = getContentCollection('docs');
  const target = buildCanonicalCollectionPath(collection, docPath);

  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}
