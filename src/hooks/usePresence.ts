import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PRESENCE_CHANNEL = 'global-presence';

export function usePresence(userId: string): Set<string> {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Remove any stale channel with this name before subscribing —
    // avoids "cannot add presence callbacks after subscribe()" on re-mount.
    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${PRESENCE_CHANNEL}`)
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        setOnlineUsers((prev) => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUsers;
}
