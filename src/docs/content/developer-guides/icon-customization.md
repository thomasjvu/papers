# Icon Customization Guide

## Overview

This documentation site supports custom icons throughout the interface. You can easily add new icons from [Iconify Design](https://iconify.design) or create your own custom SVG icons.

## Quick Start

### 1. Find Your Icon

Visit [iconify.design](https://iconify.design) and search for the icon you want:

1. Browse the icon library
2. Click on your desired icon
3. Select "SVG" from the copy options
4. Copy the SVG code

### 2. Add the Icon

Save your SVG file in the `/public/assets/icons/` directory:

```bash
# Example icon file structure
public/
  assets/
    icons/
      pixel-home.svg
      pixel-user.svg
      pixel-settings.svg
      your-new-icon.svg
```

### 3. Use the Icon

Import and use your icon in any component:

```tsx
import Image from 'next/image';

function MyComponent() {
  return <Image src="/assets/icons/your-new-icon.svg" alt="Description" width={20} height={20} />;
}
```

## Icon Standards

### Naming Convention

Follow these naming patterns for consistency:

- **Regular icons**: `icon-name.svg` (e.g., `home.svg`, `user.svg`)
- **Pixel art style**: `pixel-name.svg` (e.g., `pixel-home.svg`)
- **Brand icons**: `brand-name.svg` (e.g., `brand-github.svg`)

### Size Guidelines

| Use Case         | Recommended Size | Example                            |
| ---------------- | ---------------- | ---------------------------------- |
| Navigation icons | 20x20px          | Header buttons, menu items         |
| Content icons    | 16x16px          | Inline with text, small indicators |
| Feature icons    | 24x24px          | Section headers, callouts          |
| Large icons      | 32x32px+         | Hero sections, major features      |

### Color Standards

Icons should work with both light and dark themes:

```css
/* Theme-aware icon styling */
.icon {
  color: var(--icon-color);
  filter: none;
}

/* Dark mode adjustments for light icons */
.dark .icon-light {
  filter: invert(1);
}

/* Light mode adjustments for dark icons */
.icon-dark {
  filter: none;
}

.dark .icon-dark {
  filter: invert(1);
}
```

## Implementation Examples

### Navigation Icons

Add icons to the navigation menu:

```tsx
// In Navigation.tsx
const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: '/assets/icons/pixel-home.svg',
  },
  {
    label: 'Docs',
    href: '/docs',
    icon: '/assets/icons/pixel-book.svg',
  },
];
```

### Content Icons

Use icons in documentation content:

```markdown
## Features

![Feature Icon](/assets/icons/pixel-star.svg) **Advanced Analytics**  
Get detailed insights into your data.

![Security Icon](/assets/icons/pixel-shield.svg) **Enterprise Security**  
Bank-level security for your applications.
```

### Interactive Icons

Create interactive icon components:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

function ToggleIcon({
  activeIcon,
  inactiveIcon,
  isActive,
  onToggle,
}: {
  activeIcon: string;
  inactiveIcon: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Image
        src={isActive ? activeIcon : inactiveIcon}
        alt={isActive ? 'Active' : 'Inactive'}
        width={20}
        height={20}
        className="transition-opacity"
      />
    </button>
  );
}

// Usage
function MyComponent() {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <ToggleIcon
      activeIcon="/assets/icons/pixel-heart-filled.svg"
      inactiveIcon="/assets/icons/pixel-heart-outline.svg"
      isActive={isLiked}
      onToggle={() => setIsLiked(!isLiked)}
    />
  );
}
```

## Advanced Customization

### CSS-Only Icons

For simple shapes, consider CSS-only icons:

```css
.arrow-right {
  width: 0;
  height: 0;
  border-left: 8px solid var(--primary-color);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
}
```

### Animated Icons

Add subtle animations to icons:

```css
.icon-animated {
  transition: transform 0.2s ease;
}

.icon-animated:hover {
  transform: scale(1.1);
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Icon Sprites

For better performance with many icons, consider SVG sprites:

```xml
<!-- icons-sprite.svg -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="home" viewBox="0 0 24 24">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </symbol>
  <symbol id="user" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </symbol>
</svg>
```

```tsx
// Usage with sprites
function SpriteIcon({ id, size = 20 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} className="fill-current">
      <use href={`/assets/icons/icons-sprite.svg#${id}`} />
    </svg>
  );
}
```

## Current Icon Inventory

The site currently includes these pixel-art style icons:

### Navigation & UI

- `pixel-cog-solid.svg` - Settings/configuration
- `pixel-home-solid.svg` - Home/dashboard
- `pixel-book-open-solid.svg` - Documentation
- `pixel-folder.svg` - File system

### Content & Features

- `pixel-quote-left-solid.svg` - Blockquotes
- `pixel-star-solid.svg` - Featured content
- `pixel-shield-solid.svg` - Security features
- `pixel-chart-solid.svg` - Analytics/data

### Social Media

- `pixel-instagram.svg` - Instagram
- `pixel-twitch.svg` - Twitch
- `pixel-tiktok.svg` - TikTok
- `pixel-x.svg` - X (Twitter)

## Best Practices

### Performance

- Use SVG for scalability
- Optimize SVG files with tools like [SVGO](https://github.com/svg/svgo)
- Consider icon sprites for multiple icons
- Use appropriate sizes to avoid scaling

### Accessibility

- Always include meaningful `alt` text
- Use ARIA labels for interactive icons
- Ensure sufficient color contrast
- Provide text alternatives when needed

### Consistency

- Maintain consistent visual style
- Use the same stroke width across icon sets
- Follow the site's color palette
- Test icons in both light and dark themes

### Organization

- Group related icons in subdirectories
- Use descriptive file names
- Document custom icons in this guide
- Version control icon assets

## Troubleshooting

### Common Issues

**Icon not displaying:**

- Check the file path is correct
- Ensure the SVG file is valid
- Verify Vite can access the public directory

**Icon appears too small/large:**

- Adjust width and height props
- Check the SVG viewBox attribute
- Use CSS for responsive sizing

**Icon doesn't change color:**

- Ensure SVG uses `currentColor` or `fill="currentColor"`
- Check CSS targeting is correct
- Verify theme variables are applied

**Dark mode issues:**

- Test icons in both themes
- Use CSS filters for color inversion
- Consider separate icon variants

### Getting Help

If you encounter issues with icons:

1. Check the browser developer tools for errors
2. Validate your SVG syntax
3. Test the icon in isolation
4. Review similar working examples
5. Check the Vite documentation for static assets

---

**Next Steps:**

- [UI Configuration](./ui-configuration) - Learn about theme and layout customization
- [Best Practices](./best-practices) - Follow development guidelines
- [Code Examples](./code-examples) - See practical implementations
