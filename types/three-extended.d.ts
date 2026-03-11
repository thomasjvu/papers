import 'three';

declare module 'three' {
  export class Shape {
    constructor();
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
  }

  export class ShapeGeometry {
    constructor(shape: Shape);
    scale(x: number, y: number, z: number): void;
  }

  export class BufferGeometry {
    constructor();
    setAttribute(name: string, attribute: BufferAttribute): void;
    setFromPoints(points: Vector3[]): void;
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
  }

  export class Group extends Object3D {
    constructor();
    children: Object3D[];
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    visible: boolean;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
  }

  export class Line extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
    geometry: BufferGeometry;
    material: Material;
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: {
      color?: ColorRepresentation;
      linewidth?: number;
      linecap?: string;
      linejoin?: string;
      opacity?: number;
      transparent?: boolean;
    });
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: {
      color?: ColorRepresentation;
      opacity?: number;
      transparent?: boolean;
    });
  }

  export type ColorRepresentation = Color | string | number;

  export interface Mesh extends Object3D {
    geometry: BufferGeometry;
    material: Material;
  }
}

interface ThreeJSXElement {
  children?: React.ReactNode;
  key?: React.Key;
  ref?: React.Ref<unknown>;
  position?: [number, number, number] | { x: number; y: number; z: number };
  rotation?: [number, number, number] | { x: number; y: number; z: number };
  scale?: [number, number, number] | { x: number; y: number; z: number };
  visible?: boolean;
  args?: unknown[];
  attach?: string;
}

interface MaterialElement extends ThreeJSXElement {
  color?: string | number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeJSXElement;
      mesh: ThreeJSXElement;
      planeGeometry: ThreeJSXElement & { args?: [number?, number?] };
      sphereGeometry: ThreeJSXElement & { args?: [number?, number?, number?] };
      bufferGeometry: ThreeJSXElement;
      bufferAttribute: ThreeJSXElement & {
        attach?: string;
        count?: number;
        array?: Float32Array | number[];
      };
      meshBasicMaterial: MaterialElement;
      lineBasicMaterial: MaterialElement & { linewidth?: number };
      shaderMaterial: MaterialElement & {
        uniforms?: Record<string, unknown>;
        vertexShader?: string;
        fragmentShader?: string;
      };
      meshStandardMaterial: MaterialElement & {
        metalness?: number;
        roughness?: number;
        emissive?: string | number;
        emissiveIntensity?: number;
      };
    }
  }
}
