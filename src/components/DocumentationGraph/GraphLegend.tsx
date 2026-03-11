
import React from 'react';

interface GraphLegendProps {
  searchTerm: string;
  searchResults: { nodes: Array<{ id: string; title: string }>; hasResults: boolean };
  isSidebarView: boolean;
}

const GraphLegend: React.FC<GraphLegendProps> = React.memo(
  ({ searchTerm, searchResults, isSidebarView }) => {
    return (
      <>
        {/* Compact legend */}
        <div
          className={`graph-legend mt-2 flex flex-wrap justify-center gap-3 text-xs opacity-75 ${
            isSidebarView ? 'text-xs' : 'text-sm'
          }`}
        >
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--primary-color)' }}
            />
            <span
              style={{
                fontSize: isSidebarView ? '9px' : '11px',
                fontFamily: 'var(--mono-font)',
                color: 'var(--mindmap-legend-text)',
              }}
            >
              Pages
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--mindmap-node-current)' }}
            />
            <span
              style={{
                fontSize: isSidebarView ? '9px' : '11px',
                fontFamily: 'var(--mono-font)',
                color: 'var(--mindmap-legend-text)',
              }}
            >
              Current
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-6 h-0"
              style={{
                borderTop: `1px solid var(--mindmap-node-connected)`,
                opacity: 0.6,
              }}
            />
            <span
              style={{
                fontSize: isSidebarView ? '9px' : '11px',
                fontFamily: 'var(--mono-font)',
                color: 'var(--mindmap-legend-text)',
              }}
            >
              Folder
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-6 h-0"
              style={{
                borderTop: `1px dashed var(--accent-color)`,
                opacity: 0.4,
              }}
            />
            <span
              style={{
                fontSize: isSidebarView ? '9px' : '11px',
                fontFamily: 'var(--mono-font)',
                color: 'var(--mindmap-legend-text)',
              }}
            >
              Tags
            </span>
          </div>
          {searchTerm && (
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--mindmap-node-search)' }}
              />
              <span
                style={{
                  fontSize: isSidebarView ? '9px' : '11px',
                  fontFamily: 'var(--mono-font)',
                  color: 'var(--mindmap-legend-text)',
                }}
              >
                Matches
              </span>
            </div>
          )}
        </div>

        {/* Search results info */}
        {searchTerm && (
          <div
            className="mt-1 text-xs text-center opacity-75"
            style={{
              color: 'var(--mindmap-legend-text)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            {searchResults.hasResults
              ? `${searchResults.nodes.length} result${searchResults.nodes.length !== 1 ? 's' : ''}`
              : 'No matches found'}
          </div>
        )}
      </>
    );
  }
);

GraphLegend.displayName = 'GraphLegend';

export default GraphLegend;
