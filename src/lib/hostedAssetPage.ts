export type HostedAssetPageConfig = {
  assetUrl: string;
  assetLabel: string;
  previewPlaceholder: string;
};

export const HOSTED_ASSET_PAGES: Record<string, HostedAssetPageConfig> = {
  llms: {
    assetUrl: '/llms.txt',
    assetLabel: 'llms.txt',
    previewPlaceholder: '{llms-preview}',
  },
  skill: {
    assetUrl: '/skill.md',
    assetLabel: 'skill.md',
    previewPlaceholder: '{skill-preview}',
  },
};

export function isHostedAssetPage(path: string): path is keyof typeof HOSTED_ASSET_PAGES {
  return path in HOSTED_ASSET_PAGES;
}

export function getHostedAssetPageConfig(path: string): HostedAssetPageConfig | null {
  return isHostedAssetPage(path) ? HOSTED_ASSET_PAGES[path] : null;
}

/** Strip preview placeholder and trailing Preview section from framework page markdown. */
export function stripHostedAssetPreview(content: string, path: string): string {
  const config = getHostedAssetPageConfig(path);
  if (!config) {
    return content;
  }

  let stripped = content.replace(config.previewPlaceholder, '').trimEnd();

  const previewHeadingIndex = stripped.lastIndexOf('\n## Preview');
  if (previewHeadingIndex !== -1) {
    stripped = stripped.slice(0, previewHeadingIndex).trimEnd();
  }

  return stripped;
}