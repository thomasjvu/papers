const NODE_PADDING_X = 28;
const NODE_PADDING_Y = 20;

function readLength(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function measureLabel(label: HTMLElement): { width: number; height: number } {
  label.style.overflow = 'visible';
  label.style.whiteSpace = 'normal';
  label.style.textAlign = 'center';
  label.style.lineHeight = '1.35';
  label.style.padding = '4px 8px';

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
  const foreignObject = nodeGroup.querySelector<SVGForeignObjectElement>('foreignObject');

  if (!label || !shape || !foreignObject) {
    return;
  }

  const { width, height } = measureLabel(label);
  if (width <= 0 || height <= 0) {
    return;
  }

  resizeCenteredShape(shape, width + NODE_PADDING_X, height + NODE_PADDING_Y);

  foreignObject.style.overflow = 'visible';
  foreignObject.setAttribute('width', String(width));
  foreignObject.setAttribute('height', String(height));
  foreignObject.setAttribute('x', String(-width / 2));
  foreignObject.setAttribute('y', String(-height / 2));
}

function releaseLabelOverflow(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.nodeLabel, .cluster-label span, .cluster-label p').forEach((label) => {
    label.style.overflow = 'visible';
    label.style.whiteSpace = 'normal';
    label.style.textAlign = 'center';
    label.style.lineHeight = '1.35';
  });

  root.querySelectorAll<SVGForeignObjectElement>('foreignObject').forEach((foreignObject) => {
    foreignObject.style.overflow = 'visible';
  });
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

export function fitMermaidNodeLabels(canvas: HTMLElement | null): void {
  if (!canvas) {
    return;
  }

  releaseLabelOverflow(canvas);

  canvas.querySelectorAll<SVGGElement>('g.node').forEach((nodeGroup) => {
    fitNodeGroup(nodeGroup);
  });
}