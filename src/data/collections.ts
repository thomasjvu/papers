import {
  contentCollections,
  getContentCollection as getSharedContentCollection,
} from '../../shared/content-collections.js';

export { contentCollections };

export function getContentCollection(id: string) {
  return getSharedContentCollection(id);
}
