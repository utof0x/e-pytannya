import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Team } from '../types'
import { DEFAULT_TEAM_NAMES } from '../types'

interface Props {
  teamNames: Record<Team, string>
  onStart: (names: Record<Team, string>) => void
}

const WORDMARK = 'єПитання'

export default function SetupScreen({ teamNames, onStart }: Props) {
  // inputs start empty when the names are still the defaults, so the host types
  // straight away instead of deleting "Команда 1" first
  const [names, setNames] = useState<Record<Team, string>>(() => ({
    team1: teamNames.team1 === DEFAULT_TEAM_NAMES.team1 ? '' : teamNames.team1,
    team2: teamNames.team2 === DEFAULT_TEAM_NAMES.team2 ? '' : teamNames.team2,
  }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onStart({
      team1: names.team1.trim() || DEFAULT_TEAM_NAMES.team1,
      team2: names.team2.trim() || DEFAULT_TEAM_NAMES.team2,
    })
  }

  return (
    <div className="screen">
      <motion.form
        className="setup-wrap"
        onSubmit={submit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="interstitial-wordmark setup-wordmark">
          {WORDMARK.split('').map((char, i) => (
            <span key={i} className="letter setup-letter">
              {char}
            </span>
          ))}
        </div>

        <div className="setup-inputs">
          {(['team1', 'team2'] as const).map((team, i) => (
            <label key={team} className="setup-field">
              <span className="team-score-label">Команда {i + 1}</span>
              <input
                className="setup-input gold-block"
                value={names[team]}
                placeholder={DEFAULT_TEAM_NAMES[team]}
                maxLength={24}
                autoFocus={i === 0}
                onChange={(e) => setNames((prev) => ({ ...prev, [team]: e.target.value }))}
              />
            </label>
          ))}
        </div>

        <button type="submit" className="round-label-pill gold-block setup-start">
          Почати гру
        </button>
      </motion.form>
    </div>
  )
}
