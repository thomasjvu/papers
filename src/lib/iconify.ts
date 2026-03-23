import { addCollection } from '@iconify/react';

import { iconCollections } from './generated/icon-collections';

let collectionsRegistered = false;

export function ensureIconCollections(): void {
  if (collectionsRegistered) {
    return;
  }

  for (const collection of iconCollections) {
    addCollection(collection);
  }
  collectionsRegistered = true;
}

ensureIconCollections();
