import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { readSyncedTab, resolveTabIndex, subscribeSyncedTab, writeSyncedTab } from '../lib/tabSync';

type ContentTabsProps = {
  group: string | null;
  panels: Array<{ label: string; content: React.ReactNode }>;
};

/**
 * Accessible content tabs for `:::tabs` blocks. With a group key, the selected
 * label is persisted and shared by every tab set using that key.
 */
export default function ContentTabs({ group, panels }: ContentTabsProps) {
  const labels = panels.map((panel) => panel.label);
  const labelsKey = labels.join('\u0000');
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(() =>
    group ? resolveTabIndex(labels, readSyncedTab(group)) : 0
  );

  useEffect(() => {
    if (!group) return undefined;
    const currentLabels = labelsKey.split('\u0000');
    setActive(resolveTabIndex(currentLabels, readSyncedTab(group)));
    return subscribeSyncedTab(group, (label) => {
      const index = currentLabels.indexOf(label);
      if (index !== -1) setActive(index);
    });
  }, [group, labelsKey]);

  const select = useCallback(
    (index: number, focus = false) => {
      setActive(index);
      if (focus) tabRefs.current[index]?.focus();
      if (group) writeSyncedTab(group, labels[index]);
    },
    [group, labels]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = panels.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  };

  return (
    <div className="md-tabs" data-tabs-group={group ?? undefined}>
      <div className="md-tabs__list" role="tablist">
        {panels.map((panel, index) => (
          <button
            key={panel.label}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            className="md-tabs__tab"
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {panel.label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          key={panel.label}
          id={`${baseId}-panel-${index}`}
          role="tabpanel"
          className="md-tabs__panel"
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={active !== index}
          tabIndex={0}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
