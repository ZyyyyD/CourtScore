import { create } from 'zustand';
import type { MatchWithRelations } from '../types/match';
import { supabase } from '../lib/supabase';

type HistoryFilter = 'all' | 'wins' | 'losses';

interface HistoryState {
  matches: MatchWithRelations[];
  filter: HistoryFilter;
  isLoading: boolean;
  setFilter: (f: HistoryFilter) => void;
  loadHistory: (userId: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  matches: [],
  filter: 'all',
  isLoading: false,

  setFilter: (filter) => set({ filter }),

  loadHistory: async (userId) => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from('matches')
        .select('*, match_players(*), match_events(*)')
        .eq('status', 'completed')
        .in(
          'id',
          // Only matches where this user participated
          supabase
            .from('match_players')
            .select('match_id')
            .eq('player_id', userId) as unknown as string[],
        )
        .order('completed_at', { ascending: false })
        .limit(50);

      set({ matches: (data as MatchWithRelations[]) ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));
