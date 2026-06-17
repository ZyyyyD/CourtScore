export type TeamSide = 'team_a' | 'team_b';
export type MatchType = 'singles' | 'doubles';
export type MatchStatus = 'waiting' | 'active' | 'paused' | 'completed';
export type ShotType = 'winner' | 'error' | 'ace' | 'dink' | 'drop' | 'smash' | 'lob' | 'drive';
export type EventType = 'point' | 'undo' | 'match_start' | 'match_end';

export interface Match {
  id: string;
  match_code: string;
  match_type: MatchType;
  scoring_target: 11 | 15 | 21;
  status: MatchStatus;
  server_side: TeamSide | null;
  score_a: number;
  score_b: number;
  winner_side: TeamSide | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string | null;
  guest_name: string | null;
  team_side: TeamSide;
  position: 1 | 2;
  is_ready: boolean;
  joined_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  sequence_num: number;
  event_type: EventType;
  scoring_side: TeamSide | null;
  shot_type: ShotType | null;
  player_id: string | null;
  score_a_after: number | null;
  score_b_after: number | null;
  server_after: TeamSide | null;
  created_by: string | null;
  created_at: string;
}

export interface MatchWithRelations extends Match {
  match_players: MatchPlayer[];
  match_events: MatchEvent[];
}

export type ConnectionStatus = 'live' | 'reconnecting' | 'offline';
