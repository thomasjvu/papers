# Icon Customization

The app uses Iconify for most UI icons and a small amount of custom SVG usage when you want full control.

## Primary Icon Path

For most UI work, use `@iconify/react` with an icon name:

```tsx
import { Icon } from '@iconify/react';

export function ExampleButton() {
  return <Icon icon="mingcute:brain-line" className="h-4 w-4" />;
}
```

The current UI mostly uses the Mingcute set.

## Where Icons Usually Live

- `src/components/`: app-shell and page-level icons
- `src/constants/social.tsx`: footer/social links
- wallet blocks: runtime-generated chain icons for supported addresses

## Updating Footer Icons

Footer links are configured in `src/constants/social.tsx`.

That is the right place to change the repo link, add a social account, or swap an icon.

## Using Custom SVG Files

If you want a one-off custom SVG, put it in `public/` and reference it like any other static asset:

```tsx
<img src="/assets/icons/custom-mark.svg" alt="Custom mark" width="20" height="20" />
```

Prefer SVGs that use `currentColor` so they stay theme-aware.

## Size Guidance

- `16px` for inline UI icons
- `20px` for controls and sidebar actions
- `24px` for social or feature icons

## Theming Guidance

- default to monochrome icons so they fit the black-and-white shell
- use `currentColor` whenever possible
- check both light and dark modes
- avoid introducing a new accent color unless the icon is explicitly a brand mark

## When To Use Which Approach

- use Iconify for normal UI icons
- use custom SVG files for logos or brand-specific marks
- use a custom component only if the icon has behavior or multiple states
