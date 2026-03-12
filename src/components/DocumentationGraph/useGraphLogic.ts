import { useMemo, useCallback } from 'react';

import { documentationTree } from '../../data/documentation';
import { useDebounce } from '../../hooks/useDebounce';
import type { FileItem } from '../../types/documentation';

export interface GraphNode {
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

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
  visible: boolean;
  linkType: 'structural' | 'tag';
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function connectNodes(
  source: GraphNode,
  target: GraphNode,
  links: GraphLink[],
  strength: number,
  linkType: GraphLink['linkType']
): void {
  if (!source.connections.includes(target.id)) {
    source.connections.push(target.id);
  }

  if (!target.connections.includes(source.id)) {
    target.connections.push(source.id);
  }

  links.push({
    source: source.id,
    target: target.id,
    strength,
    visible: false,
    linkType,
  });
}

export const useGraphLogic = (
  dimensions: { width: number; height: number },
  searchTerm: string,
  currentPath?: string
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { graphNodes, graphLinks } = useMemo(() => {
    const extractedNodes: GraphNode[] = [];
    const extractedLinks: GraphLink[] = [];

    function extractNodes(items: FileItem[], level = 0, parentPath = '') {
      items.forEach((item) => {
        const nodeId = item.path;
        const node: GraphNode = {
          id: nodeId,
          title: item.name.replace(/\.md$/, ''),
          path: item.path,
          type: item.type,
          level,
          x: hashString(`${nodeId}:x`) % Math.max(dimensions.width, 1),
          y: hashString(`${nodeId}:y`) % Math.max(dimensions.height, 1),
          connections: [],
          visible: false,
          searchRelevance: 0,
          tags: item.tags,
        };

        if (parentPath) {
          node.connections.push(parentPath);
          extractedLinks.push({
            source: parentPath,
            target: nodeId,
            strength: 1,
            visible: false,
            linkType: 'structural',
          });
        }

        extractedNodes.push(node);

        if (item.children) {
          extractNodes(item.children, level + 1, nodeId);
        }
      });
    }

    extractNodes(documentationTree);

    const createTagConnections = () => {
      const nodesWithTags = extractedNodes.filter((node) => node.tags && node.tags.length > 0);

      for (let index = 0; index < nodesWithTags.length; index++) {
        for (let compareIndex = index + 1; compareIndex < nodesWithTags.length; compareIndex++) {
          const node = nodesWithTags[index];
          const comparisonNode = nodesWithTags[compareIndex];
          const sharedTags = node.tags!.filter((tag) => comparisonNode.tags!.includes(tag));

          if (sharedTags.length === 0) {
            continue;
          }

          const existingLink = extractedLinks.find(
            (link) =>
              (link.source === node.id && link.target === comparisonNode.id) ||
              (link.source === comparisonNode.id && link.target === node.id)
          );

          if (existingLink) {
            continue;
          }

          const strength = Math.min(0.3 + sharedTags.length * 0.2, 0.9);
          connectNodes(node, comparisonNode, extractedLinks, strength, 'tag');
        }
      }
    };

    createTagConnections();

    return { graphNodes: extractedNodes, graphLinks: extractedLinks };
  }, [dimensions]);

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return { nodes: [], hasResults: false };

    const query = debouncedSearchTerm.toLowerCase().trim();
    const results = graphNodes
      .map((node) => {
        const title = node.title.toLowerCase();
        const path = node.path.toLowerCase();

        let relevance = 0;

        if (title === query) relevance = 1.0;
        else if (title.startsWith(query)) relevance = 0.9;
        else if (title.includes(query)) relevance = 0.7;
        else if (path.includes(query)) relevance = 0.4;

        if (currentPath) {
          if (node.id === currentPath) relevance += 0.2;
          else if (node.connections.includes(currentPath)) relevance += 0.1;
        }

        return { ...node, searchRelevance: Math.min(relevance, 1.0) };
      })
      .filter((node) => node.searchRelevance > 0)
      .sort((a, b) => b.searchRelevance - a.searchRelevance);

    return { nodes: results, hasResults: results.length > 0 };
  }, [debouncedSearchTerm, graphNodes, currentPath]);

  const getNodeColor = useCallback(
    (node: GraphNode, themeColors: Record<string, string>): string => {
      if (debouncedSearchTerm && node.searchRelevance > 0) {
        return themeColors.search;
      }
      if (node.id === currentPath) {
        return themeColors.current;
      }
      if (node.type === 'directory') {
        return themeColors.secondary;
      }
      return themeColors.primary;
    },
    [debouncedSearchTerm, currentPath]
  );

  const getNodeRadius = useCallback(
    (node: GraphNode, isSidebarView: boolean): number => {
      const baseScale = isSidebarView ? 0.6 : 1;

      if (node.id === currentPath) return 8 * baseScale;
      if (debouncedSearchTerm && node.searchRelevance > 0.8) return 7 * baseScale;
      return node.type === 'directory' ? 6 * baseScale : 5 * baseScale;
    },
    [currentPath, debouncedSearchTerm]
  );

  return {
    graphNodes,
    graphLinks,
    searchResults,
    getNodeColor,
    getNodeRadius,
  };
};
