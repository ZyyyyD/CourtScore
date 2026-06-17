import { create } from 'zustand';
import type { Match, MatchPlayer, MatchEvent, TeamSide, ShotType, ConnectionStatus } from '../types/match';
import { supabase } from '../lib/supabase';
import { computeServerAfterPoint, isMatchOver } from '../lib/pickleball';

interface MatchState {
  currentMatch: Match | null;
  players: MatchPlayer[];
  events: MatchEvent[];
  isSyncing: boolean;
  isLocked: boolean;
  connectionStatus: ConnectionStatus;
  myTeamSide: TeamSide | null;

  // Hydrate match from DB
  setMatch: (match: Match, players: MatchPlayer[], events: MatchEvent[]) => void;
  setPlayers: (players: MatchPlayer[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setMyTeamSide: (side: TeamSide) => void;

  // Score actions
  addPoint: (side: TeamSide, shotType: ShotType | null, userId: string | null, isGuest?: boolean) => Promise<void>;
  undoLastEvent: (userId: string | null, isGuest?: boolean) => Promise<void>;

  // Realtime reconciliation (idempotent)
  applyMatchUpdate: (payload: Partial<Match>) => void;
  applyNewEvent: (event: MatchEvent) => void;
  applyPlayerUpdate: (player: MatchPlayer) => void;

  clearMatch: () => void;
}

let lockTimer: ReturnType<typeof setTimeout> | null = null;

export const useMatchStore = create<MatchState>()((set, get) => ({
  currentMatch: null,
  players: [],
  events: [],
  isSyncing: false,
  isLocked: false,
  connectionStatus: 'offline',
  myTeamSide: null,

  setMatch: (match, players, events) =>
    set({ currentMatch: match, players, events }),

  setPlayers: (players) => set({ players }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setMyTeamSide: (side) => set({ myTeamSide: side }),

  addPoint: async (side, shotType, userId, isGuest = false) => {
    const { currentMatch, events, isLocked } = get();
    if (!currentMatch || isLocked) return;

    set({ isLocked: true });
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => set({ isLocked: false }), 400);

    const newScoreA = side === 'team_a' ? currentMatch.score_a + 1 : currentMatch.score_a;
    const newScoreB = side === 'team_b' ? currentMatch.score_b + 1 : currentMatch.score_b;
    const newServer = computeServerAfterPoint(side, currentMatch.server_side ?? 'team_a', currentMatch.match_type);
    const { over, winner } = isMatchOver(newScoreA, newScoreB, currentMatch.scoring_target);
    const nextSequence = (events.length > 0 ? Math.max(...events.map((e) => e.sequence_num)) : 0) + 1;

    set({
      currentMatch: {
        ...currentMatch,
        score_a: newScoreA,
        score_b: newScoreB,
        server_side: newServer,
        status: over ? 'completed' : currentMatch.status,
        winner_side: winner,
        completed_at: over ? new Date().toISOString() : null,
      },
      events: [...events, {
        id: 'local-' + nextSequence,
        match_id: currentMatch.id,
        sequence_num: nextSequence,
        event_type: 'point',
        scoring_side: side,
        shot_type: shotType,
        score_a_after: newScoreA,
        score_b_after: newScoreB,
        server_after: newServer,
        player_id: null,
        created_by: userId,
        created_at: new Date().toISOString(),
      }],
    });

    if (isGuest) return;

    set({ isSyncing: true });
    try {
      await supabase.from('match_events').insert({
        match_id: currentMatch.id,
        sequence_num: nextSequence,
        event_type: 'point',
        scoring_side: side,
        shot_type: shotType,
        score_a_after: newScoreA,
        score_b_after: newScoreB,
        server_after: newServer,
        created_by: userId,
      });
      await supabase
        .from('matches')
        .update({
          score_a: newScoreA,
          score_b: newScoreB,
          server_side: newServer,
          status: over ? 'completed' : undefined,
          winner_side: winner ?? undefined,
          completed_at: over ? new Date().toISOString() : undefined,
        })
        .eq('id', currentMatch.id);
    } finally {
      set({ isSyncing: false });
    }
  },

  undoLastEvent: async (userId, isGuest = false) => {
    const { currentMatch, events, isLocked } = get();
    if (!currentMatch || isLocked || events.length === 0) return;

    const lastPoint = [...events].reverse().find((e) => e.event_type === 'point');
    if (!lastPoint) return;

    // Find the event before the last point to restore previous state
    const prevEvents = events.filter(
      (e) => e.event_type === 'point' && e.sequence_num < lastPoint.sequence_num,
    );
    const prevState = prevEvents.at(-1);
    const restoreScoreA = prevState?.score_a_after ?? 0;
    const restoreScoreB = prevState?.score_b_after ?? 0;
    const restoreServer = prevState?.server_after ?? currentMatch.server_side;
    const nextSequence = Math.max(...events.map((e) => e.sequence_num)) + 1;

    set({
      isLocked: true,
      currentMatch: {
        ...currentMatch,
        score_a: restoreScoreA,
        score_b: restoreScoreB,
        server_side: restoreServer,
        status: 'active',
        winner_side: null,
      },
    });
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => set({ isLocked: false }), 400);

    if (isGuest) return;

    set({ isSyncing: true });
    try {
      await supabase.from('match_events').insert({
        match_id: currentMatch.id,
        sequence_num: nextSequence,
        event_type: 'undo',
        score_a_after: restoreScoreA,
        score_b_after: restoreScoreB,
        server_after: restoreServer,
        created_by: userId,
      });
      await supabase
        .from('matches')
        .update({
          score_a: restoreScoreA,
          score_b: restoreScoreB,
          server_side: restoreServer,
          status: 'active',
          winner_side: null,
          completed_at: null,
        })
        .eq('id', currentMatch.id);
    } finally {
      set({ isSyncing: false });
    }
  },

  applyMatchUpdate: (payload) => {
    const { currentMatch } = get();
    if (!currentMatch) return;
    set({ currentMatch: { ...currentMatch, ...payload } });
  },

  applyNewEvent: (event) => {
    const { events } = get();
    if (events.some((e) => e.id === event.id)) return; // idempotent guard
    set({ events: [...events, event] });
  },

  applyPlayerUpdate: (updated) => {
    const { players } = get();
    set({
      players: players.map((p) => (p.id === updated.id ? updated : p)),
    });
  },

  clearMatch: () =>
    set({ currentMatch: null, players: [], events: [], isLocked: false, connectionStatus: 'offline', myTeamSide: null }),
}));
