import React from 'react';

import { useTheme } from '../../providers/ThemeProvider';

interface GraphControlsProps {
  scale: number;
  canReset: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  minScale: number;
  maxScale: number;
  isSidebarView: boolean;
}

const GraphControls: React.FC<GraphControlsProps> = React.memo(
  ({ scale, canReset, onZoomIn, onZoomOut, onResetZoom, minScale, maxScale, isSidebarView }) => {
    const { isDarkMode } = useTheme();

    if (isSidebarView) return null;

    return (
      <div className="absolute bottom-2 left-3 flex items-center gap-1 z-10">
        <button
          onClick={onZoomOut}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          style={{
            fontSize: '14px',
            fontFamily: 'var(--mono-font)',
            color: isDarkMode ? 'rgba(240, 240, 245, 0.6)' : 'rgba(46, 58, 35, 0.6)',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(240, 240, 245, 0.2)' : 'rgba(46, 58, 35, 0.2)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom out"
          disabled={scale <= minScale}
        >
          -
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          style={{
            fontSize: '14px',
            fontFamily: 'var(--mono-font)',
            color: isDarkMode ? 'rgba(240, 240, 245, 0.6)' : 'rgba(46, 58, 35, 0.6)',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(240, 240, 245, 0.2)' : 'rgba(46, 58, 35, 0.2)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom in"
          disabled={scale >= maxScale}
        >
          +
        </button>
        {canReset && (
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-1"
            style={{
              fontSize: '10px',
              fontFamily: 'var(--mono-font)',
              color: isDarkMode ? 'rgba(240, 240, 245, 0.6)' : 'rgba(46, 58, 35, 0.6)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(240, 240, 245, 0.2)' : 'rgba(46, 58, 35, 0.2)',
            }}
            title="Reset view (Ctrl/Cmd + 0)"
          >
            Reset
          </button>
        )}
      </div>
    );
  }
);

GraphControls.displayName = 'GraphControls';

export default GraphControls;
