import React from 'react';

interface GraphLegendProps {
  searchTerm: string;
  searchResults: { nodes: Array<{ id: string; title: string }>; hasResults: boolean };
  isSidebarView: boolean;
}

const legendTextStyle = { color: 'var(--mindmap-legend-text)', fontFamily: 'var(--mono-font)' };

const GraphLegend: React.FC<GraphLegendProps> = React.memo(
  ({ searchTerm, searchResults, isSidebarView }) => {
    const sizeClass = isSidebarView ? 'text-2xs' : 'text-xs';

    return (
      <>
        <div
          className={`graph-legend mt-2 flex flex-wrap justify-center gap-3 opacity-75 ${sizeClass}`}
        >
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--primary-color)' }}
            />
            <span className={sizeClass} style={legendTextStyle}>
              Pages
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--mindmap-node-current)' }}
            />
            <span className={sizeClass} style={legendTextStyle}>
              Current
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-0 w-6"
              style={{ borderTop: '1px solid var(--mindmap-node-connected)', opacity: 0.6 }}
            />
            <span className={sizeClass} style={legendTextStyle}>
              Folder
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-0 w-6"
              style={{ borderTop: '1px dashed var(--accent-color)', opacity: 0.4 }}
            />
            <span className={sizeClass} style={legendTextStyle}>
              Tags
            </span>
          </div>
          {searchTerm && (
            <div className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--mindmap-node-search)' }}
              />
              <span className={sizeClass} style={legendTextStyle}>
                Matches
              </span>
            </div>
          )}
        </div>

        {searchTerm && (
          <div className={`mt-1 text-center opacity-75 ui-meta ${sizeClass}`}>
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
