export interface Profile {
  id: string;
  full_name: string | null;
  nickname: string | null;
  dupr_rating: string | null;
  bio: string | null;
}

export type ChallengeStatus = 'pending' | 'accepted' | 'declined';

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: ChallengeStatus;
  created_at: string;
  challenger?: Profile;
  challenged?: Profile;
}
