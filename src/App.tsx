import { useState, useCallback, useEffect } from 'react'
import type { GameState, Team, FaceOffState, FinalState } from './types'
import { DEFAULT_TEAM_NAMES } from './types'
import { ROUNDS, TOTAL_ROUNDS } from './data/rounds'
import AnimatedBackground from './components/AnimatedBackground'
import Interstitial from './components/Interstitial'
import Board from './components/Board'
import GameEndScreen from './components/GameEndScreen'
import SetupScreen from './components/SetupScreen'
import dingSrc from './assets/ding.mp3'
import wrongSrc from './assets/wrong.mp3'
import introSrc from './assets/intro.mp3'
import './App.css'

function otherTeam(team: Team): Team {
  return team === 'team1' ? 'team2' : 'team1'
}

function freshFaceOff(): FaceOffState {
  // firstTeam/turn stay unset until the host picks who starts by clicking a team circle
  return { firstTeam: null, turn: null, team1Done: false, team2Done: false, team1Points: 0, team2Points: 0 }
}

function freshFinal(): FinalState {
  return { turn: null, points: { team1: 0, team2: 0 } }
}

type RoundFields = Pick<
  GameState,
  'boardTotal' | 'revealed' | 'boardStage' | 'controllingTeam' | 'misses' | 'faceOff' | 'final' | 'lastWinner'
>

function freshRoundFields(roundIndex: number): RoundFields {
  return {
    boardTotal: 0,
    revealed: Array(8).fill(false),
    boardStage: ROUNDS[roundIndex].isFinal ? 'final' : 'face-off',
    controllingTeam: null,
    misses: 0,
    faceOff: freshFaceOff(),
    final: freshFinal(),
    lastWinner: null,
  }
}

function initialState(teamNames: Record<Team, string> = DEFAULT_TEAM_NAMES): GameState {
  return {
    phase: 'setup',
    currentRoundIndex: 0,
    teamNames,
    scores: { team1: 0, team2: 0 },
    missFlash: 0,
    missFlashCount: 1,
    ...freshRoundFields(0),
  }
}

// resolves who wins control once both face-off teams have taken their one guess
function faceOffWinner(fo: FaceOffState): Team {
  if (fo.team1Points > fo.team2Points) return 'team1'
  if (fo.team2Points > fo.team1Points) return 'team2'
  return fo.firstTeam! // both teams have gone by the time this is called, so a pick was already made
}

// the final's winner takes the whole pot; a tie splits it evenly
function resolveFinal(scores: Record<Team, number>, final: FinalState, pot: number): Partial<GameState> {
  const { team1, team2 } = final.points
  if (team1 === team2) {
    const half = Math.floor(pot / 2)
    return {
      final,
      boardStage: 'resolved',
      lastWinner: null,
      scores: { team1: scores.team1 + half, team2: scores.team2 + half },
    }
  }
  const winner: Team = team1 > team2 ? 'team1' : 'team2'
  return {
    final,
    boardStage: 'resolved',
    lastWinner: winner,
    scores: { ...scores, [winner]: scores[winner] + pot },
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(() => initialState())

  const advance = useCallback(() => {
    setState((prev) => {
      const { phase, currentRoundIndex } = prev
      const isLastRound = currentRoundIndex === TOTAL_ROUNDS - 1

      if (phase === 'round-start') return { ...prev, phase: 'board' }

      if (phase === 'board') {
        if (prev.boardStage !== 'resolved') return prev
        if (isLastRound) return { ...prev, phase: 'game-end' }
        return {
          ...prev,
          phase: 'round-start',
          currentRoundIndex: currentRoundIndex + 1,
          ...freshRoundFields(currentRoundIndex + 1),
        }
      }

      // new game goes back to setup with the current names prefilled
      if (phase === 'game-end') return initialState(prev.teamNames)

      return prev
    })
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => {
      const { phase, currentRoundIndex } = prev

      if (phase === 'round-start') {
        if (currentRoundIndex === 0) return { ...prev, phase: 'setup' }
        return {
          ...prev,
          phase: 'board',
          currentRoundIndex: currentRoundIndex - 1,
          ...freshRoundFields(currentRoundIndex - 1),
        }
      }
      if (phase === 'board') return { ...prev, phase: 'round-start', ...freshRoundFields(currentRoundIndex) }
      if (phase === 'game-end') return { ...prev, phase: 'board', ...freshRoundFields(currentRoundIndex) }

      return prev
    })
  }, [])

  const startGame = useCallback((teamNames: Record<Team, string>) => {
    setState((prev) => (prev.phase === 'setup' ? { ...prev, phase: 'round-start', teamNames } : prev))
  }, [])

  const chooseFirstTeam = useCallback((team: Team) => {
    setState((prev) => {
      if (prev.phase !== 'board') return prev
      if (prev.boardStage === 'final') {
        if (prev.final.turn) return prev
        return { ...prev, final: { ...prev.final, turn: team } }
      }
      if (prev.boardStage !== 'face-off' || prev.faceOff.turn) return prev
      return { ...prev, faceOff: { ...prev.faceOff, firstTeam: team, turn: team } }
    })
  }, [])

  const revealAnswer = useCallback((i: number) => {
    setState((prev) => {
      if (prev.phase !== 'board' || prev.revealed[i]) return prev
      const round = ROUNDS[prev.currentRoundIndex]
      const points = round.answers[i].points
      const revealed = [...prev.revealed]
      revealed[i] = true
      const boardTotal = prev.boardTotal + points

      if (prev.boardStage === 'face-off') {
        const fo = prev.faceOff
        if (!fo.turn) return prev
        const isTeam1 = fo.turn === 'team1'
        const nextFo: FaceOffState = {
          ...fo,
          team1Points: isTeam1 ? points : fo.team1Points,
          team2Points: !isTeam1 ? points : fo.team2Points,
          team1Done: isTeam1 ? true : fo.team1Done,
          team2Done: !isTeam1 ? true : fo.team2Done,
        }
        if (nextFo.team1Done && nextFo.team2Done) {
          return {
            ...prev,
            revealed,
            boardTotal,
            faceOff: { ...nextFo, turn: null },
            boardStage: 'control',
            controllingTeam: faceOffWinner(nextFo),
          }
        }
        return { ...prev, revealed, boardTotal, faceOff: { ...nextFo, turn: isTeam1 ? 'team2' : 'team1' } }
      }

      if (prev.boardStage === 'control') {
        const winner = prev.controllingTeam!
        if (revealed.every(Boolean)) {
          return {
            ...prev,
            revealed,
            boardTotal,
            boardStage: 'resolved',
            lastWinner: winner,
            scores: { ...prev.scores, [winner]: prev.scores[winner] + boardTotal },
          }
        }
        return { ...prev, revealed, boardTotal }
      }

      if (prev.boardStage === 'final') {
        const turn = prev.final.turn
        if (!turn) return prev
        const final: FinalState = {
          turn: otherTeam(turn),
          points: { ...prev.final.points, [turn]: prev.final.points[turn] + points },
        }
        if (!revealed.every(Boolean)) return { ...prev, revealed, boardTotal, final }
        return { ...prev, revealed, boardTotal, ...resolveFinal(prev.scores, { ...final, turn: null }, boardTotal) }
      }

      if (prev.boardStage === 'steal') {
        const winner = otherTeam(prev.controllingTeam!)
        return {
          ...prev,
          revealed,
          boardTotal,
          boardStage: 'resolved',
          lastWinner: winner,
          scores: { ...prev.scores, [winner]: prev.scores[winner] + boardTotal },
        }
      }

      // resolved: the round is already scored, remaining tiles are opened by
      // the host manually for the recap rather than being revealed automatically
      if (prev.boardStage === 'resolved') return { ...prev, revealed }

      return prev
    })
  }, [])

  const markMiss = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'board') return prev
      const missFlash = prev.missFlash + 1

      if (prev.boardStage === 'face-off') {
        const fo = prev.faceOff
        if (!fo.turn) return prev
        const isTeam1 = fo.turn === 'team1'
        const nextFo: FaceOffState = {
          ...fo,
          team1Done: isTeam1 ? true : fo.team1Done,
          team2Done: !isTeam1 ? true : fo.team2Done,
        }
        if (nextFo.team1Done && nextFo.team2Done) {
          return {
            ...prev,
            missFlash,
            missFlashCount: 1,
            faceOff: { ...nextFo, turn: null },
            boardStage: 'control',
            controllingTeam: faceOffWinner(nextFo),
          }
        }
        return { ...prev, missFlash, missFlashCount: 1, faceOff: { ...nextFo, turn: isTeam1 ? 'team2' : 'team1' } }
      }

      if (prev.boardStage === 'control') {
        const misses = prev.misses + 1
        if (misses >= 2) return { ...prev, missFlash, missFlashCount: 2, misses, boardStage: 'steal' }
        return { ...prev, missFlash, missFlashCount: 1, misses }
      }

      if (prev.boardStage === 'final') {
        const turn = prev.final.turn
        if (!turn) return prev
        return { ...prev, missFlash, missFlashCount: 1, final: { ...prev.final, turn: otherTeam(turn) } }
      }

      if (prev.boardStage === 'steal') {
        const winner = prev.controllingTeam!
        return {
          ...prev,
          missFlash,
          missFlashCount: 1,
          boardStage: 'resolved',
          lastWinner: winner,
          scores: { ...prev.scores, [winner]: prev.scores[winner] + prev.boardTotal },
        }
      }

      return prev
    })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // the setup form handles its own keys (typing, Enter to submit)
      if (state.phase === 'setup') return
      if (state.phase === 'board' && e.key >= '1' && e.key <= '8') {
        revealAnswer(Number(e.key) - 1)
        return
      }
      if (state.phase === 'board' && e.code === 'Backspace') {
        markMiss()
        return
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault()
        advance()
      }
      if (e.code === 'ArrowLeft') goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, advance, goBack, revealAnswer, markMiss])

  // sound effects follow the stage transitions themselves rather than every
  // key press, so they fire the same way whether triggered by click or key
  const missFlash = state.missFlash
  useEffect(() => {
    if (missFlash > 0) new Audio(wrongSrc).play().catch(() => {})
  }, [missFlash])

  // Intro song only plays on the idle round-start screen. Browsers block
  // audio.play() until the page has had a user gesture, so the very first
  // interstitial (right after page load) can fail silently — if that
  // happens, retry on the next interaction, but never on the exact key
  // (Space/Enter/→/←) that also leaves this screen: starting playback right
  // as the round begins would just leak a blip of the song into the round,
  // which is worse than not playing it at all. The `cancelled` guard stops a
  // late-resolving rejection from attaching an orphaned listener after this
  // effect has already cleaned up (which would otherwise let the song start
  // mid-round on some later, unrelated click or keypress).
  useEffect(() => {
    if (state.phase !== 'round-start') return
    const audio = new Audio(introSrc)
    let cancelled = false
    let retry: ((e: Event) => void) | null = null

    audio.play().catch(() => {
      if (cancelled) return
      retry = (e: Event) => {
        if (e instanceof KeyboardEvent && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
          return
        }
        audio.play().catch(() => {})
        window.removeEventListener('pointerdown', retry!, { capture: true })
        window.removeEventListener('keydown', retry!, { capture: true })
      }
      window.addEventListener('pointerdown', retry, { capture: true })
      window.addEventListener('keydown', retry, { capture: true })
    })

    return () => {
      cancelled = true
      audio.pause()
      audio.currentTime = 0
      if (retry) {
        window.removeEventListener('pointerdown', retry, { capture: true })
        window.removeEventListener('keydown', retry, { capture: true })
      }
    }
  }, [state.phase])

  const round = ROUNDS[state.currentRoundIndex]

  function handleReveal(i: number) {
    new Audio(dingSrc).play().catch(() => {})
    revealAnswer(i)
  }

  return (
    <div className="app">
      <AnimatedBackground mode={state.phase === 'board' ? 'active' : 'idle'} />
      {state.phase === 'setup' && <SetupScreen teamNames={state.teamNames} onStart={startGame} />}
      {state.phase === 'round-start' && <Interstitial round={round} />}
      {state.phase === 'board' && (
        <Board
          round={round}
          revealed={state.revealed}
          boardTotal={state.boardTotal}
          scores={state.scores}
          teamNames={state.teamNames}
          boardStage={state.boardStage}
          controllingTeam={state.controllingTeam}
          misses={state.misses}
          missFlash={state.missFlash}
          missFlashCount={state.missFlashCount}
          faceOff={state.faceOff}
          final={state.final}
          isFinal={round.isFinal}
          lastWinner={state.lastWinner}
          onReveal={handleReveal}
          onChooseFirstTeam={chooseFirstTeam}
        />
      )}
      {state.phase === 'game-end' && <GameEndScreen scores={state.scores} teamNames={state.teamNames} />}
    </div>
  )
}
