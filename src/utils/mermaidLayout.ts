const NODE_PADDING_X = 28;
const NODE_PADDING_Y = 18;

function readLength(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function measureLabel(label: HTMLElement): { width: number; height: number } {
  const rect = label.getBoundingClientRect();
  const width = Math.ceil(Math.max(label.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(label.scrollHeight, rect.height));

  return { width, height };
}

function centerLabelContent(labelRoot: ParentNode): void {
  labelRoot
    .querySelectorAll<HTMLElement>('.nodeLabel, .cluster-label span, .cluster-label p')
    .forEach((label) => {
      label.style.display = 'inline-flex';
      label.style.alignItems = 'center';
      label.style.justifyContent = 'center';
      label.style.textAlign = 'center';
      label.style.width = '100%';
      label.style.whiteSpace = 'nowrap';
    });

  labelRoot.querySelectorAll<HTMLElement>('foreignObject > div').forEach((wrapper) => {
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.textAlign = 'center';
    wrapper.style.overflow = 'visible';
  });
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
    foreignObject.setAttribute('width', String(width));
    foreignObject.setAttribute('height', String(height));
    foreignObject.setAttribute('x', String(-width / 2));
    foreignObject.setAttribute('y', String(-height / 2));
  }

  labelGroup.setAttribute('transform', `translate(${-width / 2}, ${-height / 2})`);
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
    foreignObject.setAttribute('width', String(width + 16));
    foreignObject.setAttribute('height', String(height + 8));
  }
}

export async function waitForDiagramFonts(): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  const fontFamily = styles.getPropertyValue('--mono-font').trim() || 'monospace';
  const primaryFamily = fontFamily
    .split(',')[0]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');

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

  centerLabelContent(canvas);

  canvas.querySelectorAll<SVGGElement>('g.node').forEach((nodeGroup) => {
    fitNodeGroup(nodeGroup);
  });

  canvas.querySelectorAll<SVGGElement>('g.cluster').forEach((clusterGroup) => {
    fitClusterGroup(clusterGroup);
  });
}
