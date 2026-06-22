import { supabase } from '../lib/supabase';
import type { Profile, Challenge } from '../types/challenge';

export async function fetchPlayers(
  currentUserId: string,
  search: string,
): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('id, full_name, nickname, dupr_rating, bio')
    .neq('id', currentUserId)
    .order('full_name');

  if (search.trim()) {
    query = query.ilike('full_name', `%${search.trim()}%`);
  }

  const { data, error } = await query.limit(50);
  if (error) {
    console.error('[challenges] fetchPlayers:', error.message);
    return [];
  }
  return data as Profile[];
}

export async function fetchIncomingChallenges(
  userId: string,
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, challenger_id, challenged_id, status, created_at')
    .eq('challenged_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[challenges] fetchIncoming:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const challengerIds = data.map((c) => c.challenger_id as string);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, dupr_rating, bio')
    .in('id', challengerIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  return data.map((c) => ({
    ...c,
    challenger: profileMap[c.challenger_id] ?? null,
  })) as Challenge[];
}

export async function fetchOutgoingChallenges(
  userId: string,
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, challenged_id, status')
    .eq('challenger_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[challenges] fetchOutgoing:', error.message);
    return [];
  }
  return data as Challenge[];
}

export async function sendChallenge(
  challengerId: string,
  challengedId: string,
): Promise<{ error: string | null; challengeId?: string }> {
  // Avoid duplicate pending challenges
  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .eq('challenger_id', challengerId)
    .eq('challenged_id', challengedId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return { error: 'Challenge already sent' };

  const { data, error } = await supabase
    .from('challenges')
    .insert({ challenger_id: challengerId, challenged_id: challengedId })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? 'Failed to send challenge' };
  return { error: null, challengeId: data.id };
}

export async function respondChallenge(
  challengeId: string,
  status: 'accepted' | 'declined',
): Promise<string | null> {
  const { error } = await supabase
    .from('challenges')
    .update({ status })
    .eq('id', challengeId);

  return error?.message ?? null;
}

export async function acceptAndCreateMatch(
  challengeId: string,
  challengerId: string,
  challengedId: string,
): Promise<{ matchId: string } | { error: string }> {
  const { data: rpcCode } = await supabase.rpc('generate_match_code');
  const code = rpcCode ?? `PKL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      match_code: code,
      match_type: 'singles',
      scoring_target: 11,
      server_side: 'team_a',
      created_by: challengerId,
    })
    .select('id')
    .single();

  if (matchError || !match) {
    return { error: matchError?.message ?? 'Failed to create match' };
  }

  const { error: playersError } = await supabase.from('match_players').insert([
    { match_id: match.id, player_id: challengerId, team_side: 'team_a', position: 1, is_ready: false },
    { match_id: match.id, player_id: challengedId, team_side: 'team_b', position: 1, is_ready: false },
  ]);

  if (playersError) return { error: playersError.message };

  const { error: updateError } = await supabase
    .from('challenges')
    .update({ status: 'accepted', match_id: match.id })
    .eq('id', challengeId);

  if (updateError) return { error: updateError.message };

  return { matchId: match.id };
}

export async function fetchAcceptedOutgoing(
  userId: string,
  outgoingChallengeIds: string[],
): Promise<{ challengeId: string; matchId: string } | null> {
  if (outgoingChallengeIds.length === 0) return null;
  const { data } = await supabase
    .from('challenges')
    .select('id, match_id')
    .eq('challenger_id', userId)
    .in('id', outgoingChallengeIds)
    .eq('status', 'accepted')
    .not('match_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.match_id) return null;
  return { challengeId: data.id, matchId: data.match_id };
}

export function subscribeToOutgoingChallenges(
  userId: string,
  onAccepted: (matchId: string) => void,
) {
  return supabase
    .channel(`challenges_out:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `challenger_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as { status: string; match_id: string | null };
        if (row.status === 'accepted' && row.match_id) {
          onAccepted(row.match_id);
        }
      },
    )
    .subscribe();
}

export function subscribeToChallenges(
  userId: string,
  onUpdate: () => void,
) {
  const channel = supabase
    .channel(`challenges:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `challenged_id=eq.${userId}`,
      },
      onUpdate,
    )
    .subscribe();
  return channel;
}
