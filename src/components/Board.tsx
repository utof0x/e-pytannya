import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BoardStage, FaceOffState, FinalState, Round, Team } from '../types'
import crossSrc from '../assets/cross.png'

interface Props {
  round: Round
  revealed: boolean[]
  boardTotal: number
  scores: Record<Team, number>
  boardStage: BoardStage
  controllingTeam: Team | null
  misses: number
  missFlash: number
  missFlashCount: 1 | 2
  faceOff: FaceOffState
  final: FinalState
  isFinal: boolean
  lastWinner: Team | null
  onReveal: (i: number) => void
  onChooseFirstTeam: (team: Team) => void
}

const TEAM_LABEL: Record<Team, string> = { team1: 'Команда 1', team2: 'Команда 2' }

function otherTeam(team: Team): Team {
  return team === 'team1' ? 'team2' : 'team1'
}

export default function Board({
  round,
  revealed,
  boardTotal,
  scores,
  boardStage,
  controllingTeam,
  misses,
  missFlash,
  missFlashCount,
  faceOff,
  final,
  isFinal,
  lastWinner,
  onReveal,
  onChooseFirstTeam,
}: Props) {
  const awaitingFirstPick =
    (boardStage === 'face-off' && !faceOff.turn) || (boardStage === 'final' && !final.turn)
  const activeTeam = boardStage === 'final' ? final.turn : boardStage === 'face-off' ? faceOff.turn : null

  const [showCrossFlash, setShowCrossFlash] = useState(false)
  const prevMissFlash = useRef(missFlash)
  useEffect(() => {
    if (missFlash === prevMissFlash.current) return
    prevMissFlash.current = missFlash
    setShowCrossFlash(true)
    const t = setTimeout(() => setShowCrossFlash(false), 900)
    return () => clearTimeout(t)
  }, [missFlash])

  let statusText = ''
  if (awaitingFirstPick) {
    statusText = 'Оберіть, хто починає'
  } else if (boardStage === 'face-off' && faceOff.turn) {
    statusText = `Хід: ${TEAM_LABEL[faceOff.turn]}`
  } else if (boardStage === 'control' && controllingTeam) {
    statusText = `Грає: ${TEAM_LABEL[controllingTeam]}`
  } else if (boardStage === 'steal' && controllingTeam) {
    statusText = `${TEAM_LABEL[otherTeam(controllingTeam)]} краде!`
  } else if (boardStage === 'final' && final.turn) {
    statusText = `Фінал · Хід: ${TEAM_LABEL[final.turn]}`
  } else if (boardStage === 'resolved' && lastWinner) {
    statusText = `${TEAM_LABEL[lastWinner]} забирає ${boardTotal} балів!`
  } else if (boardStage === 'resolved' && isFinal) {
    statusText = `Нічия! Кожна команда отримує ${Math.floor(boardTotal / 2)} балів`
  }

  const showStrikes = boardStage === 'control' || boardStage === 'steal' || boardStage === 'resolved'

  return (
    <div className="screen board-screen">
      <AnimatePresence>
        {showCrossFlash && (
          <motion.div
            className="cross-flash"
            initial={{ opacity: 0, scale: 0.5, rotate: -8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, rotate: 0, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 1.15, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {Array.from({ length: missFlashCount }, (_, i) => (
              <img key={i} src={crossSrc} className="cross-flash-img" alt="" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="board-top">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={boardTotal}
            className="board-total-badge gold-block"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
          >
            {boardTotal}
          </motion.div>
        </AnimatePresence>

        {!awaitingFirstPick && <div className="board-question">{round.question}</div>}
      </div>

      <div className="host-panel">
        <AnimatePresence mode="wait">
          {statusText && (
            <motion.div
              key={statusText}
              className="board-status"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {statusText}
            </motion.div>
          )}
        </AnimatePresence>

        {showStrikes && (
          <div className="strike-marks">
            {[0, 1].map((i) => (
              <span key={i} className={`strike-mark ${i < misses ? 'strike-mark-active' : ''}`}>
                ✕
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="board-team-col left">
        <motion.div
          className={`team-score-badge ${awaitingFirstPick ? 'team-score-badge-selectable' : ''} ${activeTeam === 'team1' ? 'team-score-badge-active' : ''}`}
          onClick={() => awaitingFirstPick && onChooseFirstTeam('team1')}
          animate={awaitingFirstPick ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={awaitingFirstPick ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
          {scores.team1}
        </motion.div>
        <div className="team-score-label">Команда 1</div>
        {isFinal && <div className="final-points">+{final.points.team1}</div>}
      </div>

      <div className="board-team-col right">
        <motion.div
          className={`team-score-badge ${awaitingFirstPick ? 'team-score-badge-selectable' : ''} ${activeTeam === 'team2' ? 'team-score-badge-active' : ''}`}
          onClick={() => awaitingFirstPick && onChooseFirstTeam('team2')}
          animate={awaitingFirstPick ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={awaitingFirstPick ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
          {scores.team2}
        </motion.div>
        <div className="team-score-label">Команда 2</div>
        {isFinal && <div className="final-points">+{final.points.team2}</div>}
      </div>

      <div className="board-grid">
        {round.answers.map((answer, i) => {
          const isRevealed = revealed[i]
          return (
            <motion.button
              key={i}
              className={`board-slot ${isRevealed ? 'board-slot-revealed' : 'board-slot-hidden'}`}
              onClick={() => onReveal(i)}
              whileHover={!isRevealed ? { scale: 1.02 } : {}}
              whileTap={!isRevealed ? { scale: 0.98 } : {}}
            >
              {isRevealed ? (
                <motion.span
                  className="board-slot-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {answer.text}
                </motion.span>
              ) : (
                <span className="board-slot-index">{i + 1}</span>
              )}
              {isRevealed && (
                <motion.span
                  className="board-slot-points"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.35, delay: 0.1 }}
                >
                  {answer.points}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="keyboard-hint">1–8 відкрити відповідь · Backspace невірна відповідь · Space далі</div>
    </div>
  )
}
