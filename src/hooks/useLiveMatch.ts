import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useMatchStore } from '../stores/matchStore';
import type { Match, MatchEvent, MatchPlayer } from '../types/match';

export function useLiveMatch(matchId: string) {
  const { setMatch, setPlayers, applyMatchUpdate, applyNewEvent, applyPlayerUpdate, setConnectionStatus } =
    useMatchStore();

  useEffect(() => {
    let mounted = true;

    // Initial full fetch
    const fetchMatch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, match_players(*), match_events(*)')
        .eq('id', matchId)
        .single();

      if (!mounted || !data) return;
      setMatch(data as Match, data.match_players, data.match_events);
    };

    fetchMatch();

    // Subscribe to match row changes (score updates, status)
    const channel = supabase
      .channel(`live-match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => applyMatchUpdate(payload.new as Partial<Match>),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
        (payload) => applyNewEvent(payload.new as MatchEvent),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        (payload) => applyPlayerUpdate(payload.new as MatchPlayer),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('live');
        else if (status === 'CHANNEL_ERROR') setConnectionStatus('reconnecting');
        else if (status === 'CLOSED') setConnectionStatus('offline');
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [matchId]);
}

export function useLobbySync(matchId: string) {
  const { setPlayers, applyPlayerUpdate, applyMatchUpdate } = useMatchStore();

  const refetchPlayers = async () => {
    const { data } = await supabase
      .from('match_players')
      .select('*')
      .eq('match_id', matchId);
    if (data) setPlayers(data as MatchPlayer[]);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${matchId}`)
      // New player joined → re-fetch full players list
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        () => refetchPlayers(),
      )
      // Player ready toggle changed
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        (payload) => {
          applyPlayerUpdate(payload.new as MatchPlayer);
          refetchPlayers();
        },
      )
      // Match status changed (e.g. host pressed Start → navigate both devices)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => applyMatchUpdate(payload.new as Partial<Match>),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);
}
