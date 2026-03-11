declare module '*/shared/documentation-config.js' {
  export interface FileItem {
    type: 'file' | 'directory';
    name: string;
    path: string;
    children?: FileItem[];
    expanded?: boolean;
    tags?: string[];
  }

  export const documentationTree: FileItem[];
}
