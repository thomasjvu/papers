import logger from './logger';

const envLogger = logger;

export const getEnv = (name: keyof ImportMetaEnv, defaultValue?: string): string => {
  const value = import.meta.env[name] || defaultValue;

  if (value === undefined) {
    const error = `Environment variable ${name} is required but not set`;
    envLogger.error(error);
    throw new Error(error);
  }

  return value;
};

export const getBoolEnv = (name: keyof ImportMetaEnv, defaultValue?: boolean): boolean => {
  const value = import.meta.env[name];

  if (value === undefined) {
    return defaultValue ?? false;
  }

  return value.toLowerCase() === 'true';
};

export const getNumEnv = (name: keyof ImportMetaEnv, defaultValue?: number): number => {
  const value = import.meta.env[name];

  if (value === undefined) {
    return defaultValue ?? 0;
  }

  const num = Number(value);
  if (isNaN(num)) {
    envLogger.warn(`Environment variable ${name} is not a valid number: ${value}`);
    return defaultValue ?? 0;
  }

  return num;
};

export const env = {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  SSR: import.meta.env.SSR,

  DEBUG_MODE: getBoolEnv('VITE_DEBUG_MODE', false),

  SITE_NAME: import.meta.env.VITE_SITE_NAME,
  SITE_URL: import.meta.env.VITE_SITE_URL,
  GITHUB_URL: import.meta.env.VITE_GITHUB_URL,
  GITHUB_BRANCH: import.meta.env.VITE_GITHUB_BRANCH,
};

export default env;
