export function formatMatchCode(raw: string): string {
  // Ensures PKL-XXXX format for display
  const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (clean.length <= 3) return clean;
  return `PKL-${clean.slice(-4)}`;
}

export function formatMatchCodeInput(value: string): string {
  // Auto-formats user input: "PKL1234" → "PKL-1234"
  const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 7);
  if (clean.length > 3) {
    return `PKL-${clean.slice(3)}`;
  }
  return clean.startsWith('PKL') ? clean : clean.slice(0, 3);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
