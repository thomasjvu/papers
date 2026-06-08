import React from 'react';

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

const controlButtonClass =
  'ui-control-ghost flex h-6 w-6 items-center justify-center rounded-md text-xs';
const resetButtonClass =
  'ui-control-ghost ml-1 rounded-md px-2 py-1 text-2xs uppercase tracking-[0.12em]';
const monoStyle = { fontFamily: 'var(--mono-font)' };

const GraphControls: React.FC<GraphControlsProps> = React.memo(
  ({ scale, canReset, onZoomIn, onZoomOut, onResetZoom, minScale, maxScale, isSidebarView }) => {
    if (isSidebarView) {
      return null;
    }

    return (
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className={controlButtonClass}
          style={monoStyle}
          title="Zoom out"
          disabled={scale <= minScale}
          type="button"
        >
          -
        </button>
        <button
          onClick={onZoomIn}
          className={controlButtonClass}
          style={monoStyle}
          title="Zoom in"
          disabled={scale >= maxScale}
          type="button"
        >
          +
        </button>
        {canReset && (
          <button
            onClick={onResetZoom}
            className={resetButtonClass}
            style={monoStyle}
            title="Reset view (Ctrl/Cmd + 0)"
            type="button"
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
