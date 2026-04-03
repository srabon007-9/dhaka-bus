import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function PageMotion({ children }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </MotionDiv>
  );
}
