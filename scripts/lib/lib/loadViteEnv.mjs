import { loadEnv as viteLoadEnv } from 'vite';

export function resolveEnvMode(defaultMode = 'production') {
  const modeFlagIndex = process.argv.indexOf('--mode');

  if (modeFlagIndex !== -1) {
    const modeFlagValue = process.argv[modeFlagIndex + 1];

    if (modeFlagValue) {
      return modeFlagValue;
    }
  }

  return process.env.MODE || process.env.npm_config_mode || process.env.NODE_ENV || defaultMode;
}

export function loadViteEnv(rootDir = process.cwd(), mode = resolveEnvMode()) {
  return viteLoadEnv(mode, rootDir, 'VITE_');
}
