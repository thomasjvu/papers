import { div as MotionDiv } from 'framer-motion/m';

import { modalBackdropVariants } from '../animations/common';

const backdropStyle = {
  backgroundColor: 'var(--overlay-color)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
};

/** Blurred full-screen overlay behind a modal; clicking it closes the modal. */
export default function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalBackdropVariants}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50"
      style={backdropStyle}
    />
  );
}
