// From DESIGN.md — 8px unit grid
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,  // gutter
  lg:   24,  // container padding
  xl:   32,
  xxl:  40,  // section gap
  xxxl: 48,

  touchTargetMin: 48,  // minimum tap target
  containerPadding: 24,
  gutter: 16,
  sectionGap: 40,
} as const;

export const BorderRadius = {
  sm:   2,
  md:   4,   // DEFAULT — score tiles and action buttons (4px per DESIGN.md)
  lg:   8,
  xl:   12,
  full: 9999,
} as const;
