
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';

import { useTheme } from '../providers/ThemeProvider';

/**
 * Props for the MotionToggle component
 * @typedef {Object} MotionToggleProps
 * @property {string} [className] - Optional CSS class name for styling
 */
type MotionToggleProps = {
  className?: string;
};

/**
 * MotionToggle component that toggles between full motion and reduced motion
 *
 * Displays a motion icon when animations are enabled and a static icon when disabled.
 * Uses framer-motion for hover and tap animations (unless motion is reduced).
 *
 * @param {MotionToggleProps} props - Component props
 * @returns {React.ReactElement} Rendered MotionToggle component
 */
const MotionToggle = React.memo(({ className = '' }: MotionToggleProps): React.ReactElement => {
  const { prefersReducedMotion, toggleReducedMotion } = useTheme();

  // Memoized animation settings for button (disabled if motion is reduced)
  const buttonAnimations = useMemo(() => {
    if (prefersReducedMotion) {
      return {};
    }
    return {
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
    };
  }, [prefersReducedMotion]);

  // Memoized ARIA labels based on current state
  const ariaAttrs = useMemo(
    () => ({
      'aria-label': prefersReducedMotion ? 'Enable animations' : 'Reduce animations',
      title: prefersReducedMotion ? 'Enable animations' : 'Reduce animations',
    }),
    [prefersReducedMotion]
  );

  // Memoized style object
  const buttonStyle = useMemo(
    () => ({
      color: 'var(--text-color)',
    }),
    []
  );

  // Optimized motion toggle handler
  const handleToggleMotion = useCallback(() => {
    toggleReducedMotion();
  }, [toggleReducedMotion]);

  /**
   * Renders the appropriate icon based on the current motion preference
   * @returns {React.ReactElement} The motion or static icon
   */
  const renderMotionIcon = useCallback((): React.ReactElement => {
    if (prefersReducedMotion) {
      // Static icon (reduced motion)
      return <Icon icon="mingcute:pause-circle-line" className="w-5 h-5" aria-hidden="true" />;
    } else {
      // Motion icon (animations enabled)
      return <Icon icon="mingcute:play-circle-line" className="w-5 h-5" aria-hidden="true" />;
    }
  }, [prefersReducedMotion]);

  // Memoized text display
  const displayText = useMemo(() => {
    return prefersReducedMotion ? 'static' : 'motion';
  }, [prefersReducedMotion]);

  const ButtonComponent = prefersReducedMotion ? 'button' : motion.button;
  const buttonProps = prefersReducedMotion ? {} : buttonAnimations;

  return (
    <ButtonComponent
      onClick={handleToggleMotion}
      className={`p-2 rounded-full flex items-center gap-2 ${className}`}
      style={buttonStyle}
      {...buttonProps}
      {...ariaAttrs}
      tabIndex={0}
    >
      {renderMotionIcon()}
      <span className="text-2xs" style={{ fontFamily: 'var(--mono-font)' }}>
        {displayText}
      </span>
    </ButtonComponent>
  );
});

MotionToggle.displayName = 'MotionToggle';

export default MotionToggle;
