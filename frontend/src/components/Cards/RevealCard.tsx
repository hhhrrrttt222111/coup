import { AnimatePresence, motion } from 'framer-motion';
import InfluenceCard from './InfluenceCard';
import type { CardType } from '../../types';

interface RevealCardProps {
  card: CardType;
  show: boolean;
}

export default function RevealCard({ card, show }: RevealCardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 180, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <InfluenceCard card={card} isRevealed />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
