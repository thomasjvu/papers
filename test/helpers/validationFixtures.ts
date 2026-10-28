/** Version and i18n configs with every variant feature switched off. */
export function disabledVariantConfigs() {
  return {
    versionConfig: { enabled: false, current: '1.0', versions: ['1.0'], labels: {} },
    i18nConfig: { enabled: false, defaultLocale: 'en', locales: ['en'], labels: {} },
  };
}

/** Content validation options with versions, locales and OpenAPI all disabled. */
export function disabledFeatureConfigs() {
  return {
    versionConfig: { enabled: false, current: '1.0', versions: ['1.0'], labels: {} },
    i18nConfig: { enabled: false, defaultLocale: 'en', locales: ['en'] },
    openapiConfig: {
      enabled: false,
      pagePath: 'api-reference/openapi',
      defaultSpecId: 'public',
      specs: [],
    },
  };
}
