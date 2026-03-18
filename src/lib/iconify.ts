import { addCollection, type IconifyJSON } from '@iconify/react';
import mingcuteIcons from '@iconify-json/mingcute/icons.json' with { type: 'json' };
import tokenBrandedIcons from '@iconify-json/token-branded/icons.json' with { type: 'json' };

let collectionsRegistered = false;

export function ensureIconCollections(): void {
  if (collectionsRegistered) {
    return;
  }

  addCollection(mingcuteIcons as IconifyJSON);
  addCollection(tokenBrandedIcons as IconifyJSON);
  collectionsRegistered = true;
}

ensureIconCollections();
