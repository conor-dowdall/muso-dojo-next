import { type FretboardConfig } from "@/types/fretboard";

export interface FretboardTheme {
  title: string;
  config: FretboardConfig;
}

export const fretboardThemes = {
  rosewood: {
    title: "Rosewood",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02) 24%, rgb(0 0 0 / 0.24)), linear-gradient(91deg, rgb(113 70 47 / 0.18) 0%, rgb(72 43 31 / 0.28) 12%, rgb(130 80 55 / 0.12) 24%, rgb(67 38 28 / 0.24) 39%, rgb(148 92 64 / 0.1) 52%, rgb(64 38 28 / 0.26) 68%, rgb(120 75 50 / 0.12) 81%, rgb(56 31 23 / 0.26) 100%), linear-gradient(to right, #6f4730 0%, #5a3726 18%, #44291d 42%, #563325 63%, #3f261b 81%, #694130 100%)",
      fretInlayColor: "#cbc8c8ff",
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.12), rgb(0 0 0 / 0.16)), linear-gradient(to right, #bea169, #92724a)",
      fretLabelColor: "black",
      fretLabelMode: "image",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.12)), linear-gradient(to right, #e5ddd1, #bbb4a9)",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.14), 0 1px 2px rgb(0 0 0 / 0.34)",
      fretWireColor: "#cfd8dc",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.1), 0 1px 1px rgb(0 0 0 / 0.28)",
      stringColor: "#b09e9eff",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.4)",
    },
  },
  maple: {
    title: "Maple",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.2)), linear-gradient(91deg, rgb(255 255 255 / 0.02) 0%, rgb(255 255 255 / 0.02) 7%, rgb(148 102 62 / 0.08) 16%, rgb(255 255 255 / 0.02) 29%, rgb(166 112 68 / 0.1) 43%, rgb(255 255 255 / 0.02) 58%, rgb(136 91 53 / 0.08) 71%, rgb(255 255 255 / 0.03) 84%, rgb(160 108 64 / 0.08) 100%), linear-gradient(to right, #d4b381 0%, #c89f6b 14%, #bc8c58 31%, #ca9c67 47%, #ad7744 68%, #c18e58 84%, #c89b67 100%)",
      fretInlayColor: "black",
      fretInlayWidth: "9cqh",
      fretInlayHeight: "9cqh",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.12), rgb(0 0 0 / 0.16)), linear-gradient(to right, #c7a25f, #ad8240)",
      fretLabelColor: "black",
      fretLabelMode: "image",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.16)), linear-gradient(to right, #d9ccb2, #b7a288)",
      nutShadow: "1px 0 1px rgb(255 255 255 / 0.2), 0 1px 2px rgb(0 0 0 / 0.2)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.18)), linear-gradient(to right, #d0c7b8, #8d8478)",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.14), 0 1px 1px rgb(0 0 0 / 0.16)",
      stringColor: "#b09e9eff",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.1), 0 1px 2px rgb(0 0 0 / 0.24)",
    },
  },
  ebony: {
    title: "Ebony",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.01) 24%, rgb(0 0 0 / 0.28)), linear-gradient(91deg, rgb(90 80 68 / 0.08) 0%, rgb(35 30 28 / 0.22) 18%, rgb(82 73 63 / 0.06) 34%, rgb(24 22 22 / 0.24) 51%, rgb(70 63 55 / 0.08) 68%, rgb(18 18 19 / 0.26) 100%), linear-gradient(to right, #2d2928 0%, #1c1a1b 22%, #121213 48%, #1a1919 72%, #2a2523 100%)",
      fretInlayColor: "#d7d1c8",
      fretInlayWidth: "9cqh",
      fretInlayHeight: "9cqh",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.08), rgb(0 0 0 / 0.18)), linear-gradient(to right, #6e6558, #3f392f)",
      fretLabelColor: "#f3ede3",
      fretLabelMode: "image",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.14), rgb(0 0 0 / 0.14)), linear-gradient(to right, #ddd4c8, #b8aea1)",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.12), 0 1px 2px rgb(0 0 0 / 0.38)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.18)), linear-gradient(to right, #d2d5d7, #8c8f93)",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.08), 0 1px 1px rgb(0 0 0 / 0.32)",
      stringColor: "#b6a5a1",
      stringShadow:
        "0 1px 0 rgb(255 255 255 / 0.05), 0 1px 2px rgb(0 0 0 / 0.44)",
    },
  },
  pauFerro: {
    title: "Pau Ferro",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.22)), linear-gradient(91deg, rgb(186 126 78 / 0.08) 0%, rgb(110 71 45 / 0.16) 15%, rgb(201 141 89 / 0.06) 29%, rgb(88 57 38 / 0.18) 46%, rgb(171 116 72 / 0.08) 62%, rgb(84 54 37 / 0.18) 79%, rgb(148 98 61 / 0.08) 100%), linear-gradient(to right, #9a633f 0%, #7e4f31 19%, #663f29 42%, #7a4b31 64%, #5c3825 84%, #8a583a 100%)",
      fretInlayColor: "#16110d",
      fretInlayWidth: "9cqh",
      fretInlayHeight: "9cqh",
      fretInlayImage: "circle",
      fretInlayDoubles: [12, 24],
      fretLabelsBackground:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(0 0 0 / 0.16)), linear-gradient(to right, #bd8754, #8d5b36)",
      fretLabelColor: "#120d09",
      fretLabelMode: "image",
      nutColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.16), rgb(0 0 0 / 0.14)), linear-gradient(to right, #dfd5c7, #b6ab9b)",
      nutShadow:
        "1px 0 1px rgb(255 255 255 / 0.16), 0 1px 2px rgb(0 0 0 / 0.28)",
      fretWireColor:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.18)), linear-gradient(to right, #d7d0c5, #908575)",
      fretWireShadow:
        "1px 0 1px rgb(255 255 255 / 0.12), 0 1px 1px rgb(0 0 0 / 0.22)",
      stringColor: "#b09e9e",
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
