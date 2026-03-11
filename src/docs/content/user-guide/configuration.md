# Configuration

Most template changes happen in a small set of files.

## Shared Docs Structure

`shared/documentation-config.js` controls:

- homepage hero copy
- homepage feature cards
- quick-start commands
- footer links
- docs navigation tree
- per-page tags used in the UI

## Runtime UI Toggles

`src/config/ui.ts` controls mobile docs behaviors such as whether a floating file-tree button should appear.

## Social And Footer Links

`src/constants/social.tsx` defines the icon links shown in the docs footer.

## Environment Variables

Use `.env.local` for deployment-specific metadata.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
VITE_DEBUG_MODE="false"
```

## Styling

Visual tokens and component styling live primarily in `src/globals.css`.

If you want to reshape the look and feel, start there rather than scattering overrides across components.

## Recommended Order Of Changes

1. update the shared docs tree
2. replace Markdown source files
3. set site metadata env vars
4. tune colors and typography
5. run `npm run build` and verify the static output

## Next Steps

- [UI Configuration](/docs/developer-guides/ui-configuration)
- [Design System](/docs/developer-guides/design-system)
