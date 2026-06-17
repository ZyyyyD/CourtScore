import type { TeamSide } from './match';

export interface PlayerStats {
  side: TeamSide;
  totalPoints: number;
  winners: number;
  errors: number;
  aces: number;
  dinks: number;
  drops: number;
  smashes: number;
  winRate: number;  // 0–1
}

export interface MatchStats {
  teamA: PlayerStats;
  teamB: PlayerStats;
  totalRallies: number;
  scoreProgression: { rally: number; scoreA: number; scoreB: number }[];
}

export interface CareerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPointsScored: number;
  favoriteShot: string | null;
}
