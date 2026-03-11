/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GITHUB_URL?: string;
  readonly VITE_GITHUB_BRANCH?: string;
  readonly VITE_DEBUG_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
