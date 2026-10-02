import { motion } from 'framer-motion'
import type { Team } from '../types'

interface Props {
  scores: Record<Team, number>
  teamNames: Record<Team, string>
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

export default function GameEndScreen({ scores, teamNames }: Props) {
  // the final's winner holds the whole bank and the loser is left with 0, so
  // only the winner gets a card; a tied final splits the bank and shows both
  const tied = scores.team1 === scores.team2
  const winner: Team = scores.team1 > scores.team2 ? 'team1' : 'team2'
  const shown: Team[] = tied ? ['team1', 'team2'] : [winner]

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
          {shown.map((team, i) => (
            <motion.div
              key={team}
              className={`score-card ${tied ? '' : 'score-card-winner'}`}
              variants={cardVariants}
              custom={0.1 + i * 0.2}
              initial="hidden"
              animate="visible"
            >
              <div className="score-card-label">{teamNames[team]}</div>
              <div className="score-card-value">{scores[team]}</div>
              {!tied && <div className="score-card-caption">забирає всі бали гри</div>}
            </motion.div>
          ))}
        </div>

        {!tied && (
          <motion.div
            className="winner-banner gold-block"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', bounce: 0.5 }}
          >
            🏆 Перемога: {teamNames[winner]}!
          </motion.div>
        )}
        {tied && (
          <motion.div
            className="winner-banner winner-tie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Нічия! Бали поділено порівну
          </motion.div>
        )}
      </div>
      <div className="keyboard-hint">Space нова гра · H сховати</div>
    </div>
  )
}
