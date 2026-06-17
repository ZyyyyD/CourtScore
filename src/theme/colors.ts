// From DESIGN.md — Grand Slam Circuit color system
export const Colors = {
  // Backgrounds
  background:              '#121414',
  surfaceContainerLowest:  '#0c0f0f',
  surfaceContainerLow:     '#1a1c1c',
  surfaceContainer:        '#1e2020',
  surfaceContainerHigh:    '#282a2b',
  surfaceContainerHighest: '#333535',
  surfaceBright:           '#37393a',

  // Court greens (from prose section)
  court:       '#0B3D2E',  // Primary Background — deep tennis green
  courtAccent: '#1E5631',  // Grass Court Accent — containers/secondary

  // Primary (mint green accent on dark bg)
  primary:            '#a0d1bc',
  onPrimary:          '#043829',
  primaryContainer:   '#0b3d2e',
  onPrimaryContainer: '#79a894',

  // Secondary / Gold
  secondary:            '#e9c349',  // Championship gold (YAML)
  gold:                 '#D4AF37',  // Championship gold (prose)
  onSecondary:          '#3c2f00',
  secondaryContainer:   '#af8d11',

  // Tertiary (lighter green)
  tertiary:   '#99d4a4',
  onTertiary: '#003919',

  // Text
  onSurface:        '#e2e2e2',
  onSurfaceVariant: '#c0c8c3',
  white:            '#FFFFFF',
  charcoal:         '#222222',

  // Borders
  outline:        '#8a938d',
  outlineVariant: '#414944',

  // States
  error:          '#ffb4ab',
  errorContainer: '#93000a',
  success:        '#27ae60',

  // Overlays
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;
