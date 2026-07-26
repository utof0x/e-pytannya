import { motion } from 'framer-motion'
import type { Round } from '../types'

interface Props {
  round: Round
}

const WORDMARK = 'єПитання'
const LETTER_BASE_DELAY = 0.5
const LETTER_STEP = 0.045

export default function Interstitial({ round }: Props) {
  return (
    <div className="screen">
      <div className="interstitial-wrap">
        <div className="interstitial-flash" aria-hidden="true" />
        <div className="interstitial-qmark-bg" aria-hidden="true">
          ?
        </div>
        <div className="interstitial-wordmark">
          {WORDMARK.split('').map((char, i) => (
            <span
              key={i}
              className="letter"
              style={{ '--letter-delay': `${LETTER_BASE_DELAY + i * LETTER_STEP}s` } as React.CSSProperties}
            >
              {char}
            </span>
          ))}
        </div>
        <motion.div
          className="round-label-pill gold-block"
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: LETTER_BASE_DELAY + WORDMARK.length * LETTER_STEP + 0.2,
            duration: 0.6,
            type: 'spring',
            bounce: 0.4,
          }}
        >
          {round.isFinal ? 'Фінал' : `Раунд ${round.roundNumber}`}
        </motion.div>
      </div>
    </div>
  )
}
