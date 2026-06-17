// Pure pickleball scoring rules engine — no dependencies
import type { TeamSide, MatchType } from '../types/match';

export function computeServerAfterPoint(
  scoringTeam: TeamSide,
  currentServer: TeamSide,
  _matchType: MatchType,
): TeamSide {
  // Rally scoring (most common recreational format):
  // The team that scored the point serves next.
  return scoringTeam;
}

export function isMatchOver(
  scoreA: number,
  scoreB: number,
  target: number,
): { over: boolean; winner: TeamSide | null } {
  const winByTwo = true;  // Standard pickleball rule
  if (scoreA >= target && (!winByTwo || scoreA - scoreB >= 2)) {
    return { over: true, winner: 'team_a' };
  }
  if (scoreB >= target && (!winByTwo || scoreB - scoreA >= 2)) {
    return { over: true, winner: 'team_b' };
  }
  // If both are at target (e.g. 11-11), keep playing until +2
  return { over: false, winner: null };
}

export function getPlayerName(
  players: { team_side: TeamSide; guest_name: string | null }[],
  side: TeamSide,
  displayName?: string | null,
): string {
  const player = players.find((p) => p.team_side === side);
  if (!player) return side === 'team_a' ? 'Team A' : 'Team B';
  return player.guest_name ?? displayName ?? (side === 'team_a' ? 'Team A' : 'Team B');
}
