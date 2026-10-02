export type GamePhase = "setup" | "round-start" | "board" | "game-end";

export type Team = "team1" | "team2";

export const DEFAULT_TEAM_NAMES: Record<Team, string> = { team1: "Команда 1", team2: "Команда 2" };

// face-off: both teams' face-off players get one guess each; higher points wins control
// control: the winning team keeps revealing answers until 2 misses
// steal: the other team gets one guess at the remaining board
// final: captains alternate one guess at a time until every tile is open; the team
//   that collected more points in the final takes the whole pot
// resolved: round's points have been awarded, board fully revealed, waiting to advance
export type BoardStage = "face-off" | "control" | "steal" | "final" | "resolved";

export interface BoardAnswer {
  text: string;
  points: number;
}

export interface Round {
  roundNumber: number;
  isFinal: boolean;
  question: string;
  answers: BoardAnswer[]; // exactly 8, sorted roughly descending by points
}

export interface FaceOffState {
  firstTeam: Team | null; // host's pick of who starts; also the tiebreaker if both miss. null until chosen
  turn: Team | null; // whose guess is next; null before a pick is made, and again once both have gone
  team1Done: boolean;
  team2Done: boolean;
  team1Points: number; // points of the tile team1 revealed, 0 if they missed
  team2Points: number;
}

export interface FinalState {
  turn: Team | null; // whose captain guesses next; null until the host picks who starts
  points: Record<Team, number>; // points each team has opened during the final
}

export interface GameState {
  phase: GamePhase;
  currentRoundIndex: number;
  teamNames: Record<Team, string>; // entered on the setup screen, defaults when left blank
  scores: Record<Team, number>; // cumulative game score, shown in side badges
  boardTotal: number; // pot accumulated this round, shown top-center
  revealed: boolean[]; // length 8, per-slot reveal flags for the current round
  boardStage: BoardStage;
  controllingTeam: Team | null; // set once face-off resolves
  misses: number; // strikes against the controlling team, 0-2
  faceOff: FaceOffState;
  final: FinalState;
  lastWinner: Team | null; // who the pot was awarded to, shown on the resolved banner; null on a final tie
  missFlash: number; // increments on every wrong answer, used to trigger the on-screen cross flash
  missFlashCount: 1 | 2; // how many crosses that flash should show (2 only on the controlling team's 2nd strike)
}
