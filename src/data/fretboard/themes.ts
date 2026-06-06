import { type FretboardConfig } from "@/types/fretboard";
import { woodSurfaces } from "@/data/woodSurfaces";

export interface FretboardTheme {
  title: string;
  config: FretboardConfig;
}

export const fretboardThemes = {
  rosewood: {
    title: woodSurfaces.rosewood.title,
    config: {
      background: woodSurfaces.rosewood.background,
      fretInlayColor: "rgb(196 196 190 / 0.9)",
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.12), rgb(0 0 0 / 0.16)), linear-gradient(to right, rgb(190 161 105), rgb(146 114 74))",
      fretLabelColor: "black",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.12)), linear-gradient(to right, rgb(229 221 209), rgb(187 180 169))",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.14), 0 1px 2px rgb(0 0 0 / 0.34)",
      fretWireColor: "rgb(207 216 220 / 0.9)",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.1), 0 1px 1px rgb(0 0 0 / 0.28)",
      stringColor: "rgb(177 160 160)",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.4)",
    },
  },
  maple: {
    title: woodSurfaces.maple.title,
    config: {
      background: woodSurfaces.maple.background,
      fretInlayColor: "rgb(34 34 34 / 0.85)",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.12), rgb(0 0 0 / 0.16)), linear-gradient(to right, rgb(199 162 95), rgb(173 130 64))",
      fretLabelColor: "black",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.16)), linear-gradient(to right, rgb(217 204 178), rgb(183 162 136))",
      nutShadow: "1px 0 1px rgb(255 255 255 / 0.2), 0 1px 2px rgb(0 0 0 / 0.2)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.18)), linear-gradient(to right, rgb(208 199 184), rgb(141 132 120))",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.14), 0 1px 1px rgb(0 0 0 / 0.16)",
      stringColor: "rgb(176 158 158)",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.1), 0 1px 2px rgb(0 0 0 / 0.24)",
    },
  },
  ebony: {
    title: woodSurfaces.ebony.title,
    config: {
      background: woodSurfaces.ebony.background,
      fretInlayColor: "rgb(173 173 168 / 0.9)",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.08), rgb(0 0 0 / 0.18)), linear-gradient(to right, rgb(110 101 88), rgb(63 57 47))",
      fretLabelColor: "rgb(243 237 227)",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.14), rgb(0 0 0 / 0.14)), linear-gradient(to right, rgb(221 212 200), rgb(184 174 161))",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.12), 0 1px 2px rgb(0 0 0 / 0.38)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.18)), linear-gradient(to right, rgb(210 213 215), rgb(140 143 147))",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.08), 0 1px 1px rgb(0 0 0 / 0.32)",
      stringColor: "rgb(182 165 161)",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.05), 0 1px 2px rgb(0 0 0 / 0.44)",
    },
  },
  pauFerro: {
    title: woodSurfaces.pauFerro.title,
    config: {
      background: woodSurfaces.pauFerro.background,
      fretInlayColor: "rgb(191 193 189 / 0.9)",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(0 0 0 / 0.16)), linear-gradient(to right, rgb(189 135 84), rgb(141 91 54))",
      fretLabelColor: "rgb(18 13 9)",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.14)), linear-gradient(to right, rgb(223 213 199), rgb(182 171 155))",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.16), 0 1px 2px rgb(0 0 0 / 0.28)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.18)), linear-gradient(to right, rgb(215 208 197), rgb(144 133 117))",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.12), 0 1px 1px rgb(0 0 0 / 0.22)",
      stringColor: "rgb(176 158 158)",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.08), 0 1px 2px rgb(0 0 0 / 0.32)",
    },
  },
} as const satisfies Record<string, FretboardTheme>;

export const DEFAULT_FRETBOARD_THEME = "rosewood" satisfies FretboardThemeName;

export type FretboardThemeName = keyof typeof fretboardThemes;

export function normalizeFretboardThemeName(
  value: unknown,
): FretboardThemeName | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value in fretboardThemes) {
    return value as FretboardThemeName;
  }

  return undefined;
}
