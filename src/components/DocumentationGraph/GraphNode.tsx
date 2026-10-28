import {
  circle as MotionCircle,
  g as MotionG,
  rect as MotionRect,
  text as MotionText,
} from 'framer-motion/m';
import React from 'react';

import { useTheme } from '../../providers/useTheme';
import type { GraphNode as GraphNodeData } from './useGraphLogic';
import {
  getGraphNodeFlags,
  getGraphNodeLayout,
  getGraphNodeMotion,
  getGraphSwitchMotion,
  truncateGraphNodeTitle,
} from './graphNodeView';

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
    const { isActive, showSwitch } = getGraphNodeFlags(node.id, {
      currentPath,
      focusedNodeId,
      pendingSwitchNodeId,
    });
    const layout = getGraphNodeLayout({ x: node.x, y: node.y, radius: nodeRadius, isSidebarView });
    const motion = getGraphNodeMotion(prefersReducedMotion, index);
    const switchMotion = getGraphSwitchMotion(prefersReducedMotion);

    return (
      <MotionG
        className="node-group cursor-pointer"
        initial={motion.initial}
        animate={motion.animate}
        exit={motion.exit}
        transition={motion.transition}
        whileHover={motion.whileHover}
        whileTap={motion.whileTap}
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
          strokeWidth={isActive ? 2 : 1}
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
          y={layout.labelY}
          textAnchor="middle"
          className="pointer-events-none"
          style={{
            fontSize: layout.labelFontSize,
            fontFamily: 'var(--mono-font)',
            fill: themeColors.muted,
            fontWeight: 500,
          }}
        >
          {truncateGraphNodeTitle(node.title, isSidebarView)}
        </MotionText>

        {isActive && (
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

        {showSwitch && (
          <MotionG
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={switchMotion.transition}
          >
            <MotionRect
              x={layout.switchRect.x}
              y={layout.switchRect.y}
              width={layout.switchRect.width}
              height={layout.switchRect.height}
              rx={layout.switchRect.rx}
              fill={themeColors.accent}
              stroke={themeColors.background}
              strokeWidth={1}
              className="cursor-pointer"
              whileHover={switchMotion.whileHover}
              whileTap={switchMotion.whileTap}
              onClick={(event) => {
                event.stopPropagation();
                onSwitchClick(node);
              }}
            />

            <MotionText
              x={node.x}
              y={layout.switchLabelY}
              textAnchor="middle"
              className="pointer-events-none"
              style={{
                fontSize: layout.switchLabelFontSize,
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
