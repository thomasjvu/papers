import {
  circle as MotionCircle,
  g as MotionG,
  rect as MotionRect,
  text as MotionText,
} from 'framer-motion/m';
import React from 'react';

import { useTheme } from '../../providers/useTheme';
import type { GraphNode as GraphNodeData } from './useGraphLogic';

interface GraphNodeProps {
  node: GraphNodeData;
  index: number;
  currentPath?: string;
  focusedNodeId?: string;
  pendingSwitchNodeId?: string;
  themeColors: Record<string, string>;
  isSidebarView: boolean;
  glowFilterId: string;
  nodeGradientId: string;
  onNodeClick: (node: GraphNodeData) => void;
  onSwitchClick: (node: GraphNodeData) => void;
  getNodeColor: (node: GraphNodeData) => string;
  getNodeRadius: (node: GraphNodeData) => number;
}

const GraphNode: React.FC<GraphNodeProps> = React.memo(
  ({
    node,
    index,
    currentPath,
    focusedNodeId,
    pendingSwitchNodeId,
    themeColors,
    isSidebarView,
    glowFilterId,
    nodeGradientId,
    onNodeClick,
    onSwitchClick,
    getNodeColor,
    getNodeRadius,
  }) => {
    const { prefersReducedMotion } = useTheme();

    const nodeColor = getNodeColor(node);
    const nodeRadius = getNodeRadius(node);
    const activeNodeId = focusedNodeId || currentPath;
    const labelFontSize = isSidebarView ? '0.75rem' : 'var(--papers-text-2xs)';
    const switchLabelFontSize = isSidebarView ? 'var(--papers-text-2xs)' : 'var(--papers-text-xs)';

    return (
      <MotionG
        className="node-group cursor-pointer"
        initial={{
          scale: prefersReducedMotion ? 1 : 0,
          opacity: prefersReducedMotion ? 1 : 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: prefersReducedMotion ? 1 : 0,
          opacity: prefersReducedMotion ? 1 : 0,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 0.5,
          delay: prefersReducedMotion ? 0 : index * 0.05,
        }}
        whileHover={
          prefersReducedMotion
            ? {}
            : {
                scale: 1.1,
                transition: { duration: 0.2 },
              }
        }
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        onClick={() => onNodeClick(node)}
      >
        <MotionCircle
          cx={node.x}
          cy={node.y}
          r={nodeRadius + 3}
          fill={nodeColor}
          opacity={0.2}
          filter={`url(#${glowFilterId})`}
        />

        <MotionCircle
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill={nodeColor}
          stroke={themeColors.background}
          strokeWidth={node.id === activeNodeId ? 2 : 1}
        />

        <circle
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill={`url(#${nodeGradientId})`}
          pointerEvents="none"
        />

        <MotionText
          x={node.x}
          y={node.y + nodeRadius + (isSidebarView ? 8 : 12)}
          textAnchor="middle"
          className="pointer-events-none"
          style={{
            fontSize: labelFontSize,
            fontFamily: 'var(--mono-font)',
            fill: themeColors.muted,
            fontWeight: 500,
          }}
        >
          {isSidebarView
            ? node.title.length > 6
              ? `${node.title.slice(0, 6)}...`
              : node.title
            : node.title.length > 12
              ? `${node.title.slice(0, 12)}...`
              : node.title}
        </MotionText>

        {node.id === activeNodeId && (
          <g transform={`translate(${node.x} ${node.y})`}>
            <circle
              cx={0}
              cy={0}
              r={nodeRadius + 8}
              fill="none"
              stroke={themeColors.current}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              pointerEvents="none"
            >
              {!prefersReducedMotion ? (
                <>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;-16"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </>
              ) : null}
            </circle>
          </g>
        )}

        {node.id === pendingSwitchNodeId && node.id !== currentPath && (
          <MotionG
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.3,
              delay: prefersReducedMotion ? 0 : 0.4,
            }}
          >
            <MotionRect
              x={node.x - (isSidebarView ? 18 : 24)}
              y={node.y - nodeRadius - (isSidebarView ? 20 : 28)}
              width={isSidebarView ? 36 : 48}
              height={isSidebarView ? 14 : 18}
              rx={isSidebarView ? 7 : 9}
              fill={themeColors.accent}
              stroke={themeColors.background}
              strokeWidth={1}
              className="cursor-pointer"
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              onClick={(event) => {
                event.stopPropagation();
                onSwitchClick(node);
              }}
            />

            <MotionText
              x={node.x}
              y={node.y - nodeRadius - (isSidebarView ? 14 : 19)}
              textAnchor="middle"
              className="pointer-events-none"
              style={{
                fontSize: switchLabelFontSize,
                fontFamily: 'var(--mono-font)',
                fill: themeColors.background,
                fontWeight: 'bold',
                dominantBaseline: 'central',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              jump
            </MotionText>
          </MotionG>
        )}
      </MotionG>
    );
  }
);

GraphNode.displayName = 'GraphNode';

export default GraphNode;
