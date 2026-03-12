import { ANIMATION_DURATION_SECONDS } from '../constants/ui';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.normal },
};

export const slideInFromRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.normal },
};

export const slideInFromLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.normal },
};

export const slideInFromTop = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.normal },
};

export const slideInFromBottom = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.normal },
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { duration: ANIMATION_DURATION_SECONDS.fast },
};

export const bounceIn = {
  initial: { scale: 0.3, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: ANIMATION_DURATION_SECONDS.slow,
    },
  },
  exit: { scale: 0.9, opacity: 0 },
};
