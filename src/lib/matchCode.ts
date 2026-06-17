// Client-side match code generator (fallback if RPC call fails)
// Uses same character set as the Supabase generate_match_code() function
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateMatchCode(): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `PKL-${suffix}`;
}
