import { supabase } from '../lib/supabase';
import { generateMatchCode } from '../lib/matchCode';
import type { MatchType } from '../types/match';

function localId() {
  return 'local-' + Math.random().toString(36).slice(2, 10);
}

export async function createMatch(
  userId: string | null,
  guestName: string | null,
  matchType: MatchType,
  scoringTarget: 11 | 15 | 21,
  isGuest = false,
): Promise<{ matchId: string; matchCode: string } | null> {
  const matchCode = generateMatchCode();

  if (isGuest) {
    return { matchId: localId(), matchCode };
  }

  const { data: rpcCode } = await supabase.rpc('generate_match_code');
  const code = rpcCode ?? matchCode;

  const { data: match, error } = await supabase
    .from('matches')
    .insert({
      match_code: code,
      match_type: matchType,
      scoring_target: scoringTarget,
      server_side: 'team_a',
      created_by: userId,
    })
    .select('id, match_code')
    .single();

  if (error || !match) return null;

  await supabase.from('match_players').insert({
    match_id: match.id,
    player_id: userId,
    guest_name: guestName,
    team_side: 'team_a',
    position: 1,
    is_ready: false,
  });

  return { matchId: match.id, matchCode: match.match_code };
}

export async function joinMatch(
  code: string,
  userId: string | null,
  guestName: string | null,
  isGuest = false,
): Promise<{ matchId: string } | { error: string }> {
  if (isGuest) {
    return { error: 'Sign in to join a friend\'s match. Guest mode is local-only.' };
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, status')
    .eq('match_code', code.toUpperCase())
    .single();

  if (matchError) console.error('[joinMatch] match lookup error:', matchError.message);
  if (!match) return { error: `Match not found (${code.toUpperCase()}). Check the code and try again.` };
  if (match.status !== 'waiting') return { error: 'This match has already started.' };

  // Skip the "already joined" check for null userId to avoid UUID type mismatch
  if (userId) {
    const { data: existing } = await supabase
      .from('match_players')
      .select('id')
      .eq('match_id', match.id)
      .eq('player_id', userId)
      .single();
    if (existing) return { matchId: match.id };
  }

  const { error: insertError } = await supabase.from('match_players').insert({
    match_id: match.id,
    player_id: userId,
    guest_name: guestName,
    team_side: 'team_b',
    position: 1,
    is_ready: false,
  });

  if (insertError) {
    console.error('[joinMatch] insert error:', insertError.message);
    return { error: `Failed to join: ${insertError.message}` };
  }
  return { matchId: match.id };
}

export async function setReady(matchPlayerId: string, ready: boolean) {
  await supabase.from('match_players').update({ is_ready: ready }).eq('id', matchPlayerId);
}

export async function startMatch(matchId: string, isLocalMatch = false): Promise<string | null> {
  if (isLocalMatch) return null;
  console.log('[startMatch] updating matchId:', matchId);
  const { error, count } = await supabase
    .from('matches')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', matchId)
    .select();
  console.log('[startMatch] result — error:', error?.message, 'count:', count);
  if (error) return error.message;
  return null;
}
