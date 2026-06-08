import { useState } from 'react';

import { createLogger } from '../utils/logger';

const logger = createLogger('ColorPalette');

interface ColorData {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
}

interface ColorPaletteProps {
  colors: ColorData[];
}

export default function ColorPalette({ colors }: ColorPaletteProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = async (value: string, type: 'hex' | 'rgb') => {
    try {
      const textToCopy = type === 'hex' ? value : `rgb(${value})`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedColor(`${value}-${type}`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        margin: '2rem 0',
      }}
    >
      {colors.map((color, index) => (
        <div
          key={index}
          style={{
            backgroundColor: color.hex,
            borderRadius: '12px',
            padding: '2rem',
            color: getTextColor(color.hex),
            fontFamily: 'var(--mono-font)',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Color Name */}
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            {color.name}
          </div>

          {/* Hex Value with Copy Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
              position: 'relative',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '120px',
                justifyContent: 'center',
              }}
            >
              <span>{color.hex}</span>
              <button
                onClick={() => copyToClipboard(color.hex, 'hex')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Copy hex value"
              >
                {copiedColor === `${color.hex}-hex` ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* RGB Value with Copy Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              position: 'relative',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '140px',
                justifyContent: 'center',
              }}
            >
              <span>RGB({color.rgb})</span>
              <button
                onClick={() => copyToClipboard(color.rgb, 'rgb')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Copy RGB value"
              >
                {copiedColor === `${color.rgb}-rgb` ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Usage Description */}
          <div
            style={{
              fontSize: '0.8rem',
              textAlign: 'center',
              opacity: 0.9,
              fontStyle: 'italic',
              lineHeight: '1.4',
            }}
          >
            {color.usage}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to determine text color based on background
function getTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, dark for light colors
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
}
