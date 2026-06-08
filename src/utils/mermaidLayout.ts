const NODE_PADDING_X = 28;
const NODE_PADDING_Y = 18;
const DIAGRAM_PADDING_X = 20;
const DIAGRAM_PADDING_Y = 28;

function readLength(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildPaddedViewBox(
  bbox: { x: number; y: number; width: number; height: number },
  paddingX = DIAGRAM_PADDING_X,
  paddingY = DIAGRAM_PADDING_Y
): string {
  const x = bbox.x - paddingX;
  const y = bbox.y - paddingY;
  const width = bbox.width + paddingX * 2;
  const height = bbox.height + paddingY * 2;

  return `${x} ${y} ${width} ${height}`;
}

function prepareLabelForMeasure(label: HTMLElement): void {
  label.querySelectorAll('p').forEach((paragraph) => {
    paragraph.style.margin = '0';
    paragraph.style.width = '100%';
    paragraph.style.textAlign = 'center';
  });

  label.style.overflow = 'visible';
  label.style.whiteSpace = 'normal';
  label.style.textAlign = 'center';
  label.style.lineHeight = '1.35';
  label.style.width = '100%';
}

function measureLabel(label: HTMLElement): { width: number; height: number } {
  prepareLabelForMeasure(label);

  const rect = label.getBoundingClientRect();
  const width = Math.ceil(Math.max(label.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(label.scrollHeight, rect.height));

  return { width, height };
}

function resizeCenteredShape(
  shape: SVGGraphicsElement,
  targetWidth: number,
  targetHeight: number
): void {
  const currentWidth = readLength(shape.getAttribute('width'));
  const currentHeight = readLength(shape.getAttribute('height'));

  if (targetWidth <= currentWidth + 1 && targetHeight <= currentHeight + 1) {
    return;
  }

  const x = readLength(shape.getAttribute('x'));
  const y = readLength(shape.getAttribute('y'));
  const widthDelta = targetWidth - currentWidth;
  const heightDelta = targetHeight - currentHeight;

  shape.setAttribute('width', String(targetWidth));
  shape.setAttribute('height', String(targetHeight));
  shape.setAttribute('x', String(x - widthDelta / 2));
  shape.setAttribute('y', String(y - heightDelta / 2));
}

function fitNodeGroup(nodeGroup: SVGGElement): void {
  const label = nodeGroup.querySelector<HTMLElement>('.nodeLabel');
  const shape = nodeGroup.querySelector<SVGGraphicsElement>('.label-container');
  const labelGroup = nodeGroup.querySelector<SVGGElement>('g.label');

  if (!label || !shape || !labelGroup) {
    return;
  }

  const { width, height } = measureLabel(label);
  if (width <= 0 || height <= 0) {
    return;
  }

  resizeCenteredShape(shape, width + NODE_PADDING_X, height + NODE_PADDING_Y);

  const foreignObject = labelGroup.querySelector<SVGForeignObjectElement>('foreignObject');
  if (foreignObject) {
    foreignObject.style.overflow = 'visible';
    foreignObject.setAttribute('width', String(width));
    foreignObject.setAttribute('height', String(height));
    foreignObject.setAttribute('x', String(-width / 2));
    foreignObject.setAttribute('y', String(-height / 2));
  }

  labelGroup.removeAttribute('transform');
}

function fitClusterGroup(clusterGroup: SVGGElement): void {
  const label = clusterGroup.querySelector<HTMLElement>('.cluster-label span, .cluster-label p');
  const labelGroup = clusterGroup.querySelector<SVGGElement>('g.cluster-label');

  if (!label || !labelGroup) {
    return;
  }

  const { width, height } = measureLabel(label);
  if (width <= 0 || height <= 0) {
    return;
  }

  const foreignObject = labelGroup.querySelector<SVGForeignObjectElement>('foreignObject');
  if (foreignObject) {
    foreignObject.style.overflow = 'visible';
    foreignObject.setAttribute('width', String(width + 16));
    foreignObject.setAttribute('height', String(height + 8));
  }
}

function padDiagramViewBox(svg: SVGSVGElement): void {
  const bbox = svg.getBBox();
  if (bbox.width <= 0 || bbox.height <= 0) {
    return;
  }

  svg.setAttribute('viewBox', buildPaddedViewBox(bbox));
}

export async function waitForDiagramFonts(): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  const fontFamily = styles.getPropertyValue('--mono-font').trim() || 'monospace';
  const primaryFamily = fontFamily.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '');

  if (primaryFamily) {
    try {
      await document.fonts.load(`16px "${primaryFamily}"`);
      await document.fonts.load(`bold 16px "${primaryFamily}"`);
    } catch {
      // Fall back to ready when a custom face cannot be loaded explicitly.
    }
  }

  await document.fonts.ready;
}

export function normalizeMermaidDiagram(canvas: HTMLElement | null): void {
  if (!canvas) {
    return;
  }

  canvas.querySelectorAll<SVGGElement>('g.node').forEach((nodeGroup) => {
    fitNodeGroup(nodeGroup);
  });

  canvas.querySelectorAll<SVGGElement>('g.cluster').forEach((clusterGroup) => {
    fitClusterGroup(clusterGroup);
  });

  const svg = canvas.querySelector('svg');
  if (svg instanceof SVGSVGElement) {
    padDiagramViewBox(svg);
  }
}

export const fitMermaidNodeLabels = normalizeMermaidDiagram;