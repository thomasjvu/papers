const bracketAnimationConfig = {
  duration: 0.4,
  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  ease: 'easeOut' as const,
};

const exitAnimationConfig = {
  duration: 0.3,
  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  ease: 'easeOut' as const,
};

const reducedMotionVariants = {
  initial: { opacity: 0, color: 'var(--primary-color)' },
  animate: { opacity: 1, color: 'var(--primary-color)', transition: { duration: 0.05 } },
  exit: { opacity: 0, color: 'var(--primary-color)', transition: { duration: 0.05 } },
};

const enterOffsets = [10, 9, 7, 5, 4, 2, 0, 0, 0, 0, 0];
const exitOffsets = [2, 4, 5, 7, 9, 10];

/**
 * Glitchy hover brackets around nav links. The left bracket slides in from the
 * left (negative x), the right one mirrors it; reduced motion only fades.
 */
export function createBracketVariants(side: 'left' | 'right', prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return reducedMotionVariants;
  }

  const direction = side === 'left' ? -1 : 1;
  const toX = (offset: number) => (offset === 0 ? 0 : direction * offset);

  return {
    initial: {
      opacity: 0,
      x: toX(10),
      color: 'var(--primary-color)',
    },
    animate: {
      opacity: [0, 0.4, 0, 0.7, 0, 1, 0, 0, 0, 0.5, 1],
      x: enterOffsets.map(toX),
      scale: [1, 1.2, 0.8, 1.1, 0.9, 1.0, 0.95, 1.1, 0.9, 1.0, 1],
      color: [
        'var(--primary-color)',
        'transparent',
        'var(--animation-text-color)',
        'transparent',
        'transparent',
        'var(--primary-color)',
        'transparent',
        'transparent',
        'transparent',
        'var(--animation-text-color)',
        'var(--primary-color)',
      ],
      transition: {
        ...bracketAnimationConfig,
        scale: { ...bracketAnimationConfig, ease: 'easeInOut' as const },
        opacity: { ...bracketAnimationConfig, ease: 'linear' as const },
        color: { ...bracketAnimationConfig, ease: 'linear' as const },
      },
    },
    exit: {
      opacity: [1, 0, 0.7, 0, 0.4, 0],
      x: exitOffsets.map(toX),
      color: 'var(--primary-color)',
      transition: {
        ...exitAnimationConfig,
        opacity: { ...exitAnimationConfig, ease: 'linear' as const },
      },
    },
  };
}
