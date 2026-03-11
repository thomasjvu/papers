# Design System Guide

A comprehensive guide to the design system, color palettes, typography, and components that make up the documentation platform.

## Color Palettes

Our design system uses two primary color schemes that automatically adapt based on the user's theme preference, providing a cohesive visual experience across light and dark modes.

### Matcha Green (Light Mode)

The light mode uses a nature-inspired matcha green palette that promotes readability and calmness.

```ColorPalette
{
  "colors": [
    {
      "name": "Primary",
      "hex": "#678D58",
      "rgb": "103, 141, 88",
      "usage": "Primary actions, links, focus states"
    },
    {
      "name": "Secondary",
      "hex": "#A3C9A8",
      "rgb": "163, 201, 168",
      "usage": "Secondary elements, hover states"
    },
    {
      "name": "Accent",
      "hex": "#557153",
      "rgb": "85, 113, 83",
      "usage": "Accent elements, highlights"
    }
  ]
}
```

### Sakura Pink (Dark Mode)

The dark mode features a vibrant sakura pink palette that maintains excellent contrast while creating an engaging nighttime experience.

```ColorPalette
{
  "colors": [
    {
      "name": "Primary",
      "hex": "#FF85A1",
      "rgb": "255, 133, 161",
      "usage": "Primary actions, links, focus states"
    },
    {
      "name": "Secondary",
      "hex": "#FFC4DD",
      "rgb": "255, 196, 221",
      "usage": "Secondary elements, hover states"
    },
    {
      "name": "Accent",
      "hex": "#FF4989",
      "rgb": "255, 73, 137",
      "usage": "Accent elements, highlights"
    }
  ]
}
```

### Neutral Colors

Supporting colors that work across both themes for backgrounds, text, and borders.

```ColorPalette
{
  "colors": [
    {
      "name": "Light Background",
      "hex": "#FAFBF9",
      "rgb": "250, 251, 249",
      "usage": "Main background in light mode"
    },
    {
      "name": "Dark Background",
      "hex": "#0B0D0F",
      "rgb": "11, 13, 15",
      "usage": "Main background in dark mode"
    },
    {
      "name": "Text Color",
      "hex": "#1F2937",
      "rgb": "31, 41, 55",
      "usage": "Primary text color"
    },
    {
      "name": "Muted Text",
      "hex": "#6B7280",
      "rgb": "107, 114, 128",
      "usage": "Secondary text, captions"
    }
  ]
}
```

## Wallet Copy Button Component

Our design system includes interactive wallet address components with copy functionality. Here's how to implement them:

### Basic Wallet Address

```html
<code class="wallet-address" data-address="0x1234567890abcdef1234567890abcdef12345678">
  0x1234567890abcdef1234567890abcdef12345678
</code>
```

### Wallet Info Block

```html
<div class="wallet-info">
  <p class="profile-info">
    <strong>Ethereum:</strong>
    <code
      class="wallet-address"
      data-address="0x1234567890abcdef1234567890abcdef12345678"
      data-chain="eth"
    >
      0x1234567890abcdef1234567890abcdef12345678
    </code>
  </p>
  <p class="profile-info">
    <strong>Bitcoin:</strong>
    <code
      class="wallet-address"
      data-address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
      data-chain="btc"
    >
      bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
    </code>
  </p>
  <p class="profile-info">
    <strong>Base:</strong>
    <code
      class="wallet-address"
      data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
      data-chain="base"
    >
      0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
    </code>
  </p>
  <p class="profile-info">
    <strong>Solana:</strong>
    <code
      class="wallet-address"
      data-address="7VK4A5bh6XwFZMYiKcGDxRF8DzWrr8HMVBgCMhwuCCsF"
      data-chain="solana"
    >
      7VK4A5bh6XwFZMYiKcGDxRF8DzWrr8HMVBgCMhwuCCsF
    </code>
  </p>
</div>
```

The wallet addresses automatically get copy buttons when processed by the content renderer. The copy functionality includes:

- **Instant clipboard access** - One-click copying
- **Visual feedback** - Button changes to checkmark when copied
- **Toast notification** - "Copied to clipboard!" message
- **Automatic reset** - Button returns to copy icon after 1.5 seconds

### CSS Classes for Wallet Components

```css
/* Wallet address styling */
.wallet-address {
  font-family: var(--mono-font);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.4rem 0.8rem;
  padding-right: 2.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  position: relative;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
}

/* Copy button styling */
.copy-button {
  background-color: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.9;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}
```

### Live Example:

```html
<div class="wallet-info">
  <p class="profile-info">
    <strong>Ethereum:</strong>
    <code
      class="wallet-address"
      data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8e7c9"
      data-chain="eth"
    >
      0x742d35Cc6634C0532925a3b844Bc9e7595f8e7c9
    </code>
  </p>
  <p class="profile-info">
    <strong>Solana:</strong>
    <code
      class="wallet-address"
      data-address="7VK4A5bh6XwFZMYiKcGDxRF8DzWrr8HMVBgCMhwuCCsF"
      data-chain="solana"
    >
      7VK4A5bh6XwFZMYiKcGDxRF8DzWrr8HMVBgCMhwuCCsF
    </code>
  </p>
</div>
```

## Design Tokens

### CSS Custom Properties

All colors are available as CSS custom properties that automatically adapt to the current theme:

```css
/* Primary colors (theme-aware) */
--primary-color: /* #678D58 (light) | #FF85A1 (dark) */ --secondary-color:
  /* #A3C9A8 (light) | #FFC4DD (dark) */
  --accent-color: /* #557153 (light) | #FF4989 (dark) */ /* Background colors */
  --background-color: /* #FAFBF9 (light) | #0B0D0F (dark) */
  --card-color: /* #FFFFFF (light) | #111317 (dark) */ /* Text colors */
  --text-color: /* #1F2937 (light) | #F8FAFC (dark) */
  --text-secondary: /* #374151 (light) | #E2E8F0 (dark) */
  --muted-color: /* #6B7280 (light) | #94A3B8 (dark) */ /* Border colors */
  --border-color: /* #222 (light) | #bbb (dark) */
  --border-soft: /* #f2f2f2 (light) | #23232a (dark) */
  --border-unified: /* #d1d5db (light) | #374151 (dark) */;
```

### RGB Values

For opacity and rgba() usage:

```css
/* RGB values for transparency effects */
--primary-color-rgb: /* 103, 141, 88 (light) | 255, 133, 161 (dark) */;
```

## Typography

Our design system includes multiple font families for different purposes, providing flexibility and accessibility similar to design systems like Notion. Users can select their preferred font theme through the **Font Selector** in the settings.

### Font Sets

#### Sans-serif Fonts

- **Hubot Sans** - Clean, modern display font for headings and UI elements
- **Mona Sans** - Highly readable body font for general content

#### Serif Fonts

- **DM Serif Display** - Classic serif for elegant headings
- **Noto Serif JP** - International serif with excellent readability and Japanese character support

#### Monospace Font

- **MapleMono** - Clear, distinct monospace for code and technical content

### Font Families

The design system uses these font families across different contexts:

```html
<div style="margin: 2rem 0;">
  <div
    style="font-family: var(--title-font); font-size: 2rem; margin-bottom: 1rem; color: var(--text-color);"
  >
    Hubot Sans - Display & Headings
  </div>
  <div
    style="font-family: var(--serif-font); font-size: 1.8rem; margin-bottom: 1rem; color: var(--text-color);"
  >
    Noto Serif JP - Elegant Serif Option
  </div>
  <div
    style="font-family: var(--mono-font); font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-secondary);"
  >
    MapleMono - Code & Technical Text
  </div>
  <div style="font-family: var(--body-font); font-size: 1rem; color: var(--text-color);">
    Mona Sans - Body text and general content for optimal readability.
  </div>
</div>
```

### Font Theme Selection

Users can choose between different font themes using the font selector in the settings. This provides:

- **Accessibility**: Users can select fonts that work best for their reading preferences
- **Familiarity**: Similar to Notion and other modern design tools
- **Flexibility**: Different fonts for different use cases and aesthetics

Available font themes:

- **Sans (Default)**: Hubot Sans + Mona Sans
- **Serif**: DM Serif Display + Noto Serif JP
- **Mono**: MapleMono for all text

### Font Weights & Styles

```html
<div
  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;"
>
  <div style="padding: 1rem; border: 1px solid var(--border-unified); border-radius: 8px;">
    <div
      style="font-family: var(--title-font); font-weight: 300; font-size: 1.2rem; margin-bottom: 0.5rem;"
    >
      Light (300)
    </div>
    <div style="font-family: var(--mono-font); font-size: 0.8rem; color: var(--muted-color);">
      Hubot Sans Light
    </div>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-unified); border-radius: 8px;">
    <div
      style="font-family: var(--title-font); font-weight: 400; font-size: 1.2rem; margin-bottom: 0.5rem;"
    >
      Regular (400)
    </div>
    <div style="font-family: var(--mono-font); font-size: 0.8rem; color: var(--muted-color);">
      Hubot Sans Regular
    </div>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-unified); border-radius: 8px;">
    <div
      style="font-family: var(--title-font); font-weight: 700; font-size: 1.2rem; margin-bottom: 0.5rem;"
    >
      Bold (700)
    </div>
    <div style="font-family: var(--mono-font); font-size: 0.8rem; color: var(--muted-color);">
      Hubot Sans Bold
    </div>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-unified); border-radius: 8px;">
    <div
      style="font-family: var(--title-font); font-weight: 900; font-size: 1.2rem; margin-bottom: 0.5rem;"
    >
      Black (900)
    </div>
    <div style="font-family: var(--mono-font); font-size: 0.8rem; color: var(--muted-color);">
      Hubot Sans Black
    </div>
  </div>
</div>
```

### CSS Font Classes

```css
/* Font family classes */
.font-title {
  font-family: var(--title-font);
} /* Hubot Sans */
.font-mono {
  font-family: var(--mono-font);
} /* MapleMono */

/* Heading styles */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--title-font);
}
```

### Live Font Example:

```html
<div style="display: grid; gap: 1rem;">
  <div style="font-family: var(--title-font); font-size: 1.5rem; font-weight: 700;">
    Hubot Sans - Display Font
  </div>
  <div style="font-family: var(--mono-font); font-size: 1rem;">
    MapleMono - Monospace Font for Code
  </div>
  <div style="font-family: var(--body-font); font-size: 1rem;">
    Mona Sans - Body text for optimal readability
  </div>
</div>
```

## Component Examples

### Interactive Copy Buttons

The system includes reusable copy button functionality for various use cases:

#### Color Value Copy

```html
<!-- Example: Color value with copy functionality -->
<div
  style="background-color: var(--primary-color); padding: 1rem; border-radius: 8px; position: relative; margin-bottom: 1rem;"
>
  <code
    class="wallet-address"
    data-address="#678D58"
    style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);"
  >
    #678D58
  </code>
</div>
```

#### API Key Copy

```html
<!-- Example: API key with copy functionality -->
<div
  style="background-color: var(--card-color); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-unified);"
>
  <code class="wallet-address" data-address="sk-1234567890abcdef1234567890abcdef">
    sk-1234567890abcdef1234567890abcdef
  </code>
</div>
```

### Notification Styles

The system includes clean, minimal notifications with rounded borders and muted colors:

#### Notification CSS Structure

```css
.notification {
  padding: var(--space-4);
  margin: var(--space-4) 0;
  border-radius: 12px;
  border: 1px solid;
  font-family: var(--mono-font);
  display: flex;
  align-items: flex-start;
}

/* Color variants with muted tones */
.notification-info {
  background-color: rgba(100, 149, 200, 0.1);
  border-color: rgba(100, 149, 200, 0.3);
}

.notification-success {
  background-color: rgba(120, 180, 120, 0.1);
  border-color: rgba(120, 180, 120, 0.3);
}

.notification-warning {
  background-color: rgba(200, 160, 80, 0.1);
  border-color: rgba(200, 160, 80, 0.3);
}

.notification-error {
  background-color: rgba(200, 120, 120, 0.1);
  border-color: rgba(200, 120, 120, 0.3);
}
```

### Live Notification Examples:

```html
<div class="notification notification-info">
  <i
    class="mingcute:info-circle-fill"
    style="width: 20px; height: 20px; color: rgba(100, 149, 200, 0.8); margin-right: 8px;"
  ></i>
  <div>
    <strong>Info:</strong> This notification uses rounded borders and muted blue tones for a clean
    appearance.
  </div>
</div>

<div class="notification notification-success">
  <i
    class="mingcute:check-circle-fill"
    style="width: 20px; height: 20px; color: rgba(120, 180, 120, 0.8); margin-right: 8px;"
  ></i>
  <div>
    <strong>Success:</strong> Success notifications use subtle green colors and clean typography.
  </div>
</div>

<div class="notification notification-warning">
  <i
    class="mingcute:alert-triangle-fill"
    style="width: 20px; height: 20px; color: rgba(200, 160, 80, 0.8); margin-right: 8px;"
  ></i>
  <div>
    <strong>Warning:</strong> Warning notifications feature muted amber tones with proper contrast.
  </div>
</div>

<div class="notification notification-error">
  <i
    class="mingcute:close-circle-fill"
    style="width: 20px; height: 20px; color: rgba(200, 120, 120, 0.8); margin-right: 8px;"
  ></i>
  <div>
    <strong>Error:</strong> Error notifications use soft red colors while maintaining readability.
  </div>
</div>
```

## Spacing System

The design system uses a consistent spacing scale:

```html
<div style="margin: 2rem 0;">
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 0.25rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">0.25rem (4px)</code> - Minimal spacing
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 0.5rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">0.5rem (8px)</code> - Small spacing
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 1rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">1rem (16px)</code> - Base spacing
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 1.5rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">1.5rem (24px)</code> - Medium spacing
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 2rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">2rem (32px)</code> - Large spacing
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 1rem;">
    <div
      style="width: 3rem; height: 2rem; background-color: var(--primary-color); margin-right: 1rem;"
    ></div>
    <code style="font-family: var(--mono-font);">3rem (48px)</code> - Extra large spacing
  </div>
</div>
```

## Border Radius

Consistent border radius values across components:

```html
<div
  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0;"
>
  <div
    style="background-color: var(--card-color); border: 1px solid var(--border-unified); border-radius: 4px; padding: 1rem; text-align: center;"
  >
    <code style="font-family: var(--mono-font);">4px</code><br />Small radius
  </div>
  <div
    style="background-color: var(--card-color); border: 1px solid var(--border-unified); border-radius: 6px; padding: 1rem; text-align: center;"
  >
    <code style="font-family: var(--mono-font);">6px</code><br />Medium radius
  </div>
  <div
    style="background-color: var(--card-color); border: 1px solid var(--border-unified); border-radius: 8px; padding: 1rem; text-align: center;"
  >
    <code style="font-family: var(--mono-font);">8px</code><br />Base radius
  </div>
  <div
    style="background-color: var(--card-color); border: 1px solid var(--border-unified); border-radius: 12px; padding: 1rem; text-align: center;"
  >
    <code style="font-family: var(--mono-font);">12px</code><br />Large radius
  </div>
</div>
```

## Accessibility

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:

- **Text on Primary**: White text on primary colors meets 4.5:1 contrast ratio
- **Primary on Background**: Primary colors on background meet 3:1 contrast ratio for large text
- **Muted Text**: Secondary text colors maintain at least 4.5:1 contrast with backgrounds

### Reduced Motion

The design system respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

All interactive elements include visible focus indicators:

```css
input:focus,
button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

## Implementation Guide

### Using Color Palettes in Components

1. **Always use CSS custom properties** instead of hardcoded colors
2. **Test in both light and dark modes** to ensure proper contrast
3. **Use semantic color names** rather than specific color values

```css
/* Good */
.my-component {
  background-color: var(--card-color);
  color: var(--text-color);
  border: 1px solid var(--border-unified);
}

/* Avoid */
.my-component {
  background-color: #ffffff;
  color: #1f2937;
  border: 1px solid #d1d5db;
}
```

### Adding Copy Functionality

To add copy buttons to any element:

1. **Add the data-address attribute** with the value to copy
2. **Use the wallet-address class** for styling
3. **The system automatically adds** copy buttons and functionality

```html
<code class="wallet-address" data-address="VALUE_TO_COPY"> Displayed Text </code>
```

### Adding New Colors

When extending the palette:

1. **Define both light and dark variants**
2. **Add RGB values for transparency**
3. **Test accessibility compliance**
4. **Document usage guidelines**

```css
:root {
  --new-color: #your-light-color;
  --new-color-rgb: r, g, b;
}

.dark {
  --new-color: #your-dark-color;
  --new-color-rgb: r, g, b;
}
```

## Resources

### Color Tools

- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Verify WCAG compliance
- [Coolors.co](https://coolors.co/) - Generate harmonious color palettes
- [Adobe Color](https://color.adobe.com/) - Advanced color theory tools

### Typography Resources

- [Google Fonts](https://fonts.google.com/) - Web font hosting
- [Font Squirrel](https://www.fontsquirrel.com/) - Font testing and optimization

### Design System Examples

- [Material Design](https://material.io/design/color/) - Google's design system
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) - Apple's design principles
- [Atlassian Design System](https://atlassian.design/) - Enterprise design system example

---

This design system provides the foundation for consistent, accessible, and beautiful user interfaces across the documentation platform.
