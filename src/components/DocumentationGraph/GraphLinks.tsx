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

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  visible: boolean;
  linkType: 'structural' | 'tag';
}

interface GraphLinksProps {
  links: GraphLink[];
  nodes: GraphNode[];
  visibleLinks: Set<string>;
  themeColors: Record<string, string>;
  isSidebarView: boolean;
}

const GraphLinks: React.FC<GraphLinksProps> = React.memo(
  ({ links, nodes, visibleLinks, themeColors, isSidebarView }) => {
    const { prefersReducedMotion } = useTheme();

    return (
      <g className="links">
        {links.map((link, index) => {
          const sourceNode = nodes.find((n) => n.id === link.source);
          const targetNode = nodes.find((n) => n.id === link.target);

          if (!sourceNode || !targetNode) return null;

          const linkKey = `${link.source}-${link.target}`;
          const isVisible = visibleLinks.has(linkKey);

          if (!isVisible) return null;

          return (
            <motion.line
              key={`${link.source}-${link.target}-${link.linkType}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={link.linkType === 'tag' ? themeColors.accent : themeColors.connected}
              strokeWidth={isSidebarView ? 1 : 1.5}
              strokeOpacity={link.linkType === 'tag' ? 0.4 : 0.6}
              strokeDasharray={link.linkType === 'tag' ? '4,4' : ''}
              style={{
                strokeDasharray: link.linkType === 'tag' ? '4,4' : 'none',
              }}
              initial={{
                pathLength: prefersReducedMotion ? 1 : 0,
                opacity: prefersReducedMotion ? (link.linkType === 'tag' ? 0.4 : 0.6) : 0,
              }}
              animate={{
                pathLength: 1,
                opacity: link.linkType === 'tag' ? 0.4 : 0.6,
              }}
              exit={{
                pathLength: prefersReducedMotion ? 1 : 0,
                opacity: prefersReducedMotion ? (link.linkType === 'tag' ? 0.4 : 0.6) : 0,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.8,
                delay: prefersReducedMotion ? 0 : index * 0.1,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </g>
    );
  }
);

GraphLinks.displayName = 'GraphLinks';

export default GraphLinks;
