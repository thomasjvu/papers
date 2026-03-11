/**
 * UI Configuration
 *
 * This file contains UI feature toggles that can be easily customized
 * by users who fork this project.
 */

export interface UIConfig {
  /**
   * Show floating mobile file tree toggle button
   *
   * When enabled, shows a floating action button on mobile devices
   * that allows users to toggle the documentation file tree sidebar.
   *
   * @default false
   */
  showMobileFileTreeToggle: boolean;

  /**
   * Mobile toggle button position
   *
   * Controls the position of the floating mobile toggle button.
   *
   * @default 'bottom-left'
   */
  mobileTogglePosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

/**
 * Default UI Configuration
 *
 * Users can modify these values to customize the UI behavior.
 * These settings will apply to all users of the forked project.
 */
export const uiConfig: UIConfig = {
  // Disabled by default - users can access file tree via navigation menu
  showMobileFileTreeToggle: false,

  // Position the toggle button in the bottom-left corner
  mobileTogglePosition: 'bottom-left',
};

/**
 * Get position classes based on configuration
 */
export function getMobileTogglePositionClasses(position: UIConfig['mobileTogglePosition']): string {
  switch (position) {
    case 'bottom-left':
      return 'bottom-6 left-6';
    case 'bottom-right':
      return 'bottom-6 right-6';
    case 'top-left':
      return 'top-6 left-6';
    case 'top-right':
      return 'top-6 right-6';
    default:
      return 'bottom-6 left-6';
  }
}
