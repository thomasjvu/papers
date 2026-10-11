import safeLocalStorage from '../utils/storage.ts';

export const TAB_STORAGE_PREFIX = 'papers-tabs:';
const TAB_SYNC_EVENT = 'papers-tabs-change';

type TabSyncDetail = { group: string; label: string };

export function readSyncedTab(group: string): string | null {
  return safeLocalStorage.getItem(`${TAB_STORAGE_PREFIX}${group}`);
}

/** Persist a group's choice and notify every tab set on this page. */
export function writeSyncedTab(group: string, label: string): void {
  safeLocalStorage.setItem(`${TAB_STORAGE_PREFIX}${group}`, label);
  window.dispatchEvent(
    new CustomEvent<TabSyncDetail>(TAB_SYNC_EVENT, { detail: { group, label } })
  );
}

/** Subscribe to choices from this page and from other browser tabs (storage event). */
export function subscribeSyncedTab(group: string, onChange: (label: string) => void): () => void {
  const onLocal = (event: Event) => {
    const detail = (event as CustomEvent<TabSyncDetail>).detail;
    if (detail?.group === group) onChange(detail.label);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === `${TAB_STORAGE_PREFIX}${group}` && event.newValue) onChange(event.newValue);
  };
  window.addEventListener(TAB_SYNC_EVENT, onLocal);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(TAB_SYNC_EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
  };
}

/** Index of the stored label, or 0 when it is missing or not offered here. */
export function resolveTabIndex(labels: string[], stored: string | null): number {
  if (!stored) return 0;
  const index = labels.indexOf(stored);
  return index === -1 ? 0 : index;
}
