// Match code format: PKL- followed by 4 alphanumeric characters
const MATCH_CODE_RE = /^PKL-[A-Z0-9]{4}$/;

export function isValidMatchCode(code: string): boolean {
  return MATCH_CODE_RE.test(code.toUpperCase());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 30;
}
