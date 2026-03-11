// This declaration file is used to resolve TypeScript issues with three.js
declare module 'three' {
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }

  export class Mesh {
    material: ShaderMaterial | MeshStandardMaterial;
    position: Vector3;
    visible: boolean;
  }

  export class ShaderMaterial {
    uniforms: Record<
      string,
      {
        value: number | Vector2 | Vector3 | Color | boolean;
      }
    >;
  }

  export class MeshStandardMaterial {
    color: Color;
    emissive: Color;
    emissiveIntensity: number;
    transparent: boolean;
    opacity: number;
  }

  export class Vector2 {
    set(x: number, y: number): this;
  }

  export class Color {
    constructor(color: string);
  }
}
