import { supabase } from '../lib/supabase';
import type { Profile } from '../types/challenge';

export type FriendRequest = {
  id: string;
  requester_id: string;
  requester: Profile | null;
};

export async function fetchFriends(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('[friends] fetchFriends:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const friendIds = data.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, dupr_rating, bio')
    .in('id', friendIds);

  return (profiles ?? []) as Profile[];
}

export async function fetchIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[friends] fetchIncomingRequests:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const requesterIds = data.map((r) => r.requester_id as string);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, dupr_rating, bio')
    .in('id', requesterIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return data.map((row) => ({
    ...row,
    requester: (profileMap[row.requester_id] ?? null) as Profile | null,
  }));
}

export async function fetchOutgoingFriendRequestIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[friends] fetchOutgoingRequestIds:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.addressee_id as string));
}

export async function fetchFriendIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('[friends] fetchFriendIds:', error.message);
    return new Set();
  }
  return new Set(
    (data ?? []).map((row) =>
      row.requester_id === userId ? row.addressee_id : row.requester_id,
    ),
  );
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  return error?.message ?? null;
}

export async function respondFriendRequest(
  requestId: string,
  action: 'accepted' | 'ignored',
): Promise<string | null> {
  if (action === 'ignored') {
    const { error } = await supabase.from('friendships').delete().eq('id', requestId);
    return error?.message ?? null;
  }
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  return error?.message ?? null;
}

export function subscribeToFriendships(userId: string, onUpdate: () => void) {
  return supabase
    .channel(`friendships:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` },
      onUpdate,
    )
    .subscribe();
}
