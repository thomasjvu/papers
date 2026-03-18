import { motion } from 'framer-motion';
import React from 'react';

import { useTheme } from '../../providers/ThemeProvider';

interface GraphNode {
  id: string;
  title: string;
  path: string;
  type: 'file' | 'directory';
  x: number;
  y: number;
  level: number;
  connections: string[];
  visible: boolean;
  searchRelevance: number;
  tags?: string[];
}

interface GraphNodeProps {
  node: GraphNode;
  index: number;
  currentPath?: string;
  focusedNodeId?: string;
  clickedNodeId?: string;
  pendingSwitchNodeId?: string;
  themeColors: Record<string, string>;
  isSidebarView: boolean;
  glowFilterId: string;
  nodeGradientId: string;
  onNodeClick: (node: GraphNode) => void;
  onSwitchClick: (node: GraphNode) => void;
  getNodeColor: (node: GraphNode) => string;
  getNodeRadius: (node: GraphNode) => number;
}

const GraphNode: React.FC<GraphNodeProps> = React.memo(
  ({
    node,
    index,
    currentPath,
    focusedNodeId: _focusedNodeId,
    clickedNodeId,
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
    const labelFontSize = isSidebarView ? '0.5rem' : 'var(--text-2xs)';
    const switchLabelFontSize = isSidebarView ? '0.5rem' : 'var(--text-xs)';

    return (
      <motion.g
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
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={nodeRadius + 3}
          fill={nodeColor}
          opacity={0.2}
          filter={`url(#${glowFilterId})`}
        />

        <motion.circle
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill={nodeColor}
          stroke={themeColors.background}
          strokeWidth={node.id === currentPath ? 2 : 1}
        />

        <circle
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill={`url(#${nodeGradientId})`}
          pointerEvents="none"
        />

        <motion.text
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
        </motion.text>

        {node.id === currentPath && (
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius + 5}
            fill="none"
            stroke={themeColors.current}
            strokeWidth={1.5}
            strokeDasharray="3,3"
            animate={{
              rotate: 360,
              strokeDashoffset: [0, -6],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
              strokeDashoffset: { duration: 1, repeat: Infinity, ease: 'linear' },
            }}
          />
        )}

        {node.id === clickedNodeId && (
          <>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill="none"
              stroke={themeColors.accent}
              strokeWidth={2}
              initial={{ r: nodeRadius, opacity: 0.8 }}
              animate={{ r: nodeRadius + 15, opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.6,
                ease: 'easeOut',
              }}
            />

            <motion.text
              x={node.x}
              y={node.y + 2}
              textAnchor="middle"
              className="pointer-events-none"
              style={{
                fontSize: isSidebarView ? '0.5rem' : 'var(--text-xs)',
                fontFamily: 'var(--mono-font)',
                fill: themeColors.accent,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.3,
                delay: prefersReducedMotion ? 0 : 0.1,
              }}
            >
              ok
            </motion.text>
          </>
        )}

        {node.id === pendingSwitchNodeId && node.id !== currentPath && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.3,
              delay: prefersReducedMotion ? 0 : 0.4,
            }}
          >
            <motion.rect
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

            <motion.text
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
            </motion.text>
          </motion.g>
        )}
      </motion.g>
    );
  }
);

GraphNode.displayName = 'GraphNode';

export default GraphNode;
