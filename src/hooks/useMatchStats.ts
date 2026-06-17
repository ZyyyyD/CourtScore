import { useMemo } from 'react';
import type { MatchEvent, TeamSide } from '../types/match';
import type { MatchStats, PlayerStats } from '../types/stats';

function buildPlayerStats(side: TeamSide, events: MatchEvent[]): PlayerStats {
  const pointEvents = events.filter((e) => e.event_type === 'point' && e.scoring_side === side);
  const total = pointEvents.length;

  return {
    side,
    totalPoints: total,
    winners: pointEvents.filter((e) => e.shot_type === 'winner').length,
    errors: events.filter((e) => e.event_type === 'point' && e.scoring_side !== side && e.shot_type === 'error').length,
    aces: pointEvents.filter((e) => e.shot_type === 'ace').length,
    dinks: pointEvents.filter((e) => e.shot_type === 'dink').length,
    drops: pointEvents.filter((e) => e.shot_type === 'drop').length,
    smashes: pointEvents.filter((e) => e.shot_type === 'smash').length,
    winRate: total / Math.max(1, events.filter((e) => e.event_type === 'point').length),
  };
}

export function useMatchStats(events: MatchEvent[]): MatchStats {
  return useMemo(() => {
    const pointEvents = events.filter((e) => e.event_type === 'point');

    const scoreProgression = pointEvents.map((e, i) => ({
      rally: i + 1,
      scoreA: e.score_a_after ?? 0,
      scoreB: e.score_b_after ?? 0,
    }));

    return {
      teamA: buildPlayerStats('team_a', events),
      teamB: buildPlayerStats('team_b', events),
      totalRallies: pointEvents.length,
      scoreProgression,
    };
  }, [events]);
}
