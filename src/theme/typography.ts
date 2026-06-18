// From DESIGN.md — Anybody for scores/headlines, Hanken Grotesk for UI text
export const FontFamily = {
  anybody: "Anybody_800ExtraBold",
  anybodyBold: "Anybody_700Bold",
  anybodySemi: "Anybody_600SemiBold",
  hanken: "HankenGrotesk_400Regular",
  hankenMedium: "HankenGrotesk_500Medium",
  hankenBold: "HankenGrotesk_700Bold",
} as const;

export const Typography = {
  // Score display — primary focal point on court screens
  scoreDisplay: {
    fontFamily: FontFamily.anybody,
    fontSize: 64,
    fontWeight: "800" as const,
    lineHeight: 64,
    letterSpacing: -1.28, // ~-0.02em at 64px
  },
  scoreDisplayLg: {
    fontFamily: FontFamily.anybody,
    fontSize: 96,
    fontWeight: "800" as const,
    lineHeight: 100,
    letterSpacing: -3.84, // ~-0.04em at 96px
  },
  headlineLg: {
    fontFamily: FontFamily.anybody,
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
    letterSpacing: 0.64, // 0.02em
  },
  headlineMd: {
    fontFamily: FontFamily.anybody,
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 31,
    letterSpacing: 0.48, // 0.02em
  },
  bodyLg: {
    fontFamily: FontFamily.hankenMedium,
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: FontFamily.hanken,
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  // All caps labels — SERVER, TIMEOUT, LIVE, etc.
  labelCaps: {
    fontFamily: FontFamily.hankenBold,
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 16,
    letterSpacing: 1.2, // 0.1em
    textTransform: "uppercase" as const,
  },
  labelSm: {
    fontFamily: FontFamily.hanken,
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
} as const;
