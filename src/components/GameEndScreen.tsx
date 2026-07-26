import { motion, AnimatePresence } from 'framer-motion'
import type { Team } from '../types'

interface Props {
  scores: Record<Team, number>
}

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.85 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay, duration: 0.6, type: 'spring' as const, bounce: 0.35 },
  }),
}

export default function GameEndScreen({ scores }: Props) {
  const team1Leads = scores.team1 > scores.team2
  const tied = scores.team1 === scores.team2

  return (
    <div className="screen">
      <div className="round-end-center">
        <motion.h1
          className="round-end-title"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Гра завершена!
        </motion.h1>

        <div className="score-cards">
          <motion.div className="score-card" variants={cardVariants} custom={0.1} initial="hidden" animate="visible">
            <div className="score-card-label">Команда 1</div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={scores.team1}
                className="score-card-value"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
              >
                {scores.team1}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div className="score-card" variants={cardVariants} custom={0.3} initial="hidden" animate="visible">
            <div className="score-card-label">Команда 2</div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={scores.team2}
                className="score-card-value"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
              >
                {scores.team2}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {!tied && (
          <motion.div
            className="winner-banner gold-block"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', bounce: 0.5 }}
          >
            🏆 {team1Leads ? 'Перемогла команда 1!' : 'Перемогла команда 2!'}
          </motion.div>
        )}
        {tied && (
          <motion.div
            className="winner-banner winner-tie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Нічия!
          </motion.div>
        )}
      </div>
      <div className="keyboard-hint">Space нова гра</div>
    </div>
  )
}
