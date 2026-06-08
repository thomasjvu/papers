function titleCaseFromSegment(segment) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function titleCaseFromPath(path) {
  const leaf = path.split('/').pop() || path;
  return titleCaseFromSegment(leaf);
}

function cloneTree(items) {
  return items.map((item) => {
    if (item.type === 'directory') {
      return {
        ...item,
        children: cloneTree(item.children || []),
      };
    }

    return { ...item };
  });
}

export function addFileToTree(tree, docPath) {
  const segments = docPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return tree;
  }

  const updated = cloneTree(tree);
  const fileSegment = segments[segments.length - 1];
  const dirSegments = segments.slice(0, -1);

  let items = updated;
  let currentPath = '';

  for (const segment of dirSegments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    let directory = items.find((item) => item.type === 'directory' && item.path === currentPath);

    if (!directory) {
      directory = {
        type: 'directory',
        name: titleCaseFromSegment(segment),
        path: currentPath,
        children: [],
      };
      items.push(directory);
    }

    items = directory.children;
  }

  if (!items.some((item) => item.type === 'file' && item.path === docPath)) {
    items.push({
      type: 'file',
      name: `${titleCaseFromPath(docPath)}.md`,
      path: docPath,
    });
  }

  return updated;
}

function serializeTags(tags, indent) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }

  const tagList = tags.map((tag) => `'${tag.replace(/'/g, "\\'")}'`).join(', ');
  return `\n${indent}  tags: [${tagList}],`;
}

function serializeTreeItem(item, depth = 2) {
  const indent = '  '.repeat(depth);
  const inner = '  '.repeat(depth + 1);

  if (item.type === 'directory') {
    const children = (item.children || [])
      .map((child) => serializeTreeItem(child, depth + 1))
      .join(',\n');

    return `${indent}{
${inner}type: 'directory',
${inner}name: '${item.name.replace(/'/g, "\\'")}',
${inner}path: '${item.path.replace(/'/g, "\\'")}',
${inner}children: [
${children}
${inner}],
${indent}}`;
  }

  const tags = serializeTags(item.tags, inner);
  return `${indent}{
${inner}type: 'file',
${inner}name: '${item.name.replace(/'/g, "\\'")}',
${inner}path: '${item.path.replace(/'/g, "\\'")}',${tags}
${indent}}`;
}

export function serializeDocumentationTree(tree) {
  const body = tree.map((item) => serializeTreeItem(item)).join(',\n');
  return `export const documentationTree = [\n${body},\n];`;
}

export function replaceDocumentationTreeExport(source, tree) {
  const marker = 'export const documentationTree = [';
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error('Could not find documentationTree export in shared/documentation-config.js');
  }

  let index = start + marker.length;
  let depth = 1;

  while (index < source.length && depth > 0) {
    const char = source[index];

    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
    }

    index += 1;
  }

  if (depth !== 0) {
    throw new Error('Could not parse documentationTree export boundaries');
  }

  const end = source[index] === ';' ? index + 1 : index;
  const serialized = serializeDocumentationTree(tree);
  return `${source.slice(0, start)}${serialized}${source.slice(end)}`;
}