export const MUSIC_GROUP_ACCENT_COLORS = [
  "oklch(66% 0.16 145deg)",
  "oklch(68% 0.14 220deg)",
  "oklch(68% 0.16 28deg)",
  "oklch(67% 0.14 305deg)",
  "oklch(70% 0.13 110deg)",
] as const;

export function getMusicGroupAccentColor(index: number) {
  const paletteIndex =
    ((index % MUSIC_GROUP_ACCENT_COLORS.length) +
      MUSIC_GROUP_ACCENT_COLORS.length) %
    MUSIC_GROUP_ACCENT_COLORS.length;

  return MUSIC_GROUP_ACCENT_COLORS[paletteIndex];
}
