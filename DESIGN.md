---
name: Grand Slam Circuit
colors:
  surface: "#121414"
  surface-dim: "#121414"
  surface-bright: "#37393a"
  surface-container-lowest: "#0c0f0f"
  surface-container-low: "#1a1c1c"
  surface-container: "#1e2020"
  surface-container-high: "#282a2b"
  surface-container-highest: "#333535"
  on-surface: "#e2e2e2"
  on-surface-variant: "#c0c8c3"
  inverse-surface: "#e2e2e2"
  inverse-on-surface: "#2f3131"
  outline: "#8a938d"
  outline-variant: "#414944"
  surface-tint: "#a0d1bc"
  primary: "#a0d1bc"
  on-primary: "#043829"
  primary-container: "#0b3d2e"
  on-primary-container: "#79a894"
  inverse-primary: "#396756"
  secondary: "#e9c349"
  on-secondary: "#3c2f00"
  secondary-container: "#af8d11"
  on-secondary-container: "#342800"
  tertiary: "#99d4a4"
  on-tertiary: "#003919"
  tertiary-container: "#003f1d"
  on-tertiary-container: "#72ab7f"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#bcedd7"
  primary-fixed-dim: "#a0d1bc"
  on-primary-fixed: "#002116"
  on-primary-fixed-variant: "#214f3f"
  secondary-fixed: "#ffe088"
  secondary-fixed-dim: "#e9c349"
  on-secondary-fixed: "#241a00"
  on-secondary-fixed-variant: "#574500"
  tertiary-fixed: "#b5f1bf"
  tertiary-fixed-dim: "#99d4a4"
  on-tertiary-fixed: "#00210c"
  on-tertiary-fixed-variant: "#18512c"
  background: "#121414"
  on-background: "#e2e2e2"
  surface-variant: "#333535"
typography:
  score-display:
    fontFamily: Anybody
    fontSize: 96px
    fontWeight: "800"
    lineHeight: 100px
    letterSpacing: -0.04em
  score-display-mobile:
    fontFamily: Anybody
    fontSize: 64px
    fontWeight: "800"
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  touch-target-min: 48px
  gutter: 16px
  section-gap: 40px
---

## Brand & Style

The design system is engineered for the "Grand Slam Circuit" aesthetic—a fusion of elite sports heritage and modern digital precision. It targets competitive athletes who demand clarity under high-pressure environments, such as outdoor courts under direct sunlight.

The style is **Corporate / Modern** with a **High-Contrast** sporting edge. It leverages the prestige of traditional tennis aesthetics (deep greens and gold) while utilizing the aggressive, bold layouts found in premium sports broadcasting. The emotional response is one of authority, discipline, and high-performance reliability. Every interface element is optimized for rapid, high-stakes data entry and instant legibility from a distance.

## Colors

The palette is rooted in the "Deep Tennis Green" to establish a prestigious, focused environment.

- **Primary Background (#0B3D2E):** Used for the main canvas to reduce glare and provide a rich, sophisticated backdrop.
- **Grass Court Accent (#1E5631):** Used for subtle layering, containers, and secondary action areas to maintain the monochromatic depth.
- **Championship Gold (#D4AF37):** Reserved exclusively for "winning" moments, active states, premium indicators, and high-priority highlights.
- **High-Contrast White (#FFFFFF):** Primary text and icon color to ensure maximum readability against the dark green base.
- **Dark Charcoal (#222222):** Used for high-contrast inverted cards or specific UI elements that require a break from the green tonal range.

## Typography

This design system utilizes two distinct typefaces to balance broadcasting impact with UI utility.

- **Anybody:** Chosen for its athletic, variable nature. It is used for all "Scoreboard" elements and major headlines. Its extra-bold weights provide the "Impact" necessary for quick glances on the court.
- **Hanken Grotesk:** A clean, contemporary sans-serif used for labels, metadata, and secondary instructions. It provides a technical, professional contrast to the expressive headlines.

**Formatting Rule:** Scores should always use `score-display` to ensure they are the primary focal point of the screen. All functional labels (e.g., "SERVER", "TIMEOUT") must use `label-caps`.

## Layout & Spacing

The layout follows a **Fixed Grid** model for maximum structural stability during active movement.

- **Thumb-Zone Optimization:** All primary action buttons (Score Increment, Undo, Timeout) are placed in the bottom 40% of the screen.
- **Breathing Room:** Large 40px gaps between major sections prevent accidental taps during sweaty or high-movement play.
- **Adaptation:**
  - **Mobile:** Single column focus. Scores are stacked or placed in large side-by-side tiles.
  - **Tablet/Desktop:** Horizontal split-screen layout, mimicking a television broadcast scoreboard, with player stats flanking the central score.

## Elevation & Depth

The system uses **Tonal Layers** rather than heavy shadows to maintain a clean, "Wimbledon" aesthetic.

- **Level 0 (Base):** Deep Tennis Green (#0B3D2E).
- **Level 1 (Cards):** Grass Court Green (#1E5631) with a subtle 1px Gold (#D4AF37) top-border for premium containers.
- **Level 2 (Active/Modals):** Dark Charcoal (#222222) with high-opacity white outlines (0.1) to create separation from the green environment.
- **Interaction:** No shadows are used for buttons; instead, depth is communicated through "Inset" gold borders when pressed, mimicking a physical tactile switch.

## Shapes

The design system employs **Soft (1)** roundedness. This 4px corner radius reflects the architectural precision of professional stadiums and high-end sports equipment.

- **Score Tiles:** Should remain strictly square or slightly rounded (4px) to maintain the "Scoreboard" look.
- **Action Buttons:** Use the 4px radius; avoid pill shapes to stay away from "casual" social media aesthetics and maintain the "Pro" feel.

## Components

- **Large Score Displays:** High-contrast tiles using `score-display`. The background should be `surface-charcoal` with `neutral-white` text. The active server is indicated by a 4px Gold border around their score tile.
- **One-Tap Action Buttons:** Large, full-width or half-width blocks with a minimum height of 64px. Primary actions use the Gold accent with Dark Charcoal text.
- **Real-Time Sync Indicators:** A small, pulsing Gold dot next to a "Live" label in the header, signaling the match is broadcasting/syncing.
- **Match Stats Chips:** Compact, Grass Court Green (#1E5631) pills with White `label-caps` text for "Winner," "Unforced Error," etc.
- **Lists:** Player lists and match history should use thin 1px separators in `secondary_color` at 20% opacity.
- **Input Fields:** Dark Charcoal backgrounds with Gold bottom-borders (2px) on focus.
