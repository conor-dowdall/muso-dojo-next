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
        "linear-gradient(to bottom, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02) 24%, rgb(0 0 0 / 0.24)), linear-gradient(91deg, rgb(113 70 47 / 0.18) 0%, rgb(72 43 31 / 0.28) 12%, rgb(130 80 55 / 0.12) 24%, rgb(67 38 28 / 0.24) 39%, rgb(148 92 64 / 0.1) 52%, rgb(64 38 28 / 0.26) 68%, rgb(120 75 50 / 0.12) 81%, rgb(56 31 23 / 0.26) 100%), linear-gradient(to right, rgb(111 71 48) 0%, rgb(90 55 38) 18%, rgb(68 41 29) 42%, rgb(86 51 37) 63%, rgb(63 38 27) 81%, rgb(105 65 48) 100%)",
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
    title: "Maple",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.2)), linear-gradient(91deg, rgb(255 255 255 / 0.02) 0%, rgb(255 255 255 / 0.02) 7%, rgb(148 102 62 / 0.08) 16%, rgb(255 255 255 / 0.02) 29%, rgb(166 112 68 / 0.1) 43%, rgb(255 255 255 / 0.02) 58%, rgb(136 91 53 / 0.08) 71%, rgb(255 255 255 / 0.03) 84%, rgb(160 108 64 / 0.08) 100%), linear-gradient(to right, rgb(212 179 129) 0%, rgb(200 159 107) 14%, rgb(188 140 88) 31%, rgb(202 156 103) 47%, rgb(173 119 68) 68%, rgb(193 142 88) 84%, rgb(200 155 103) 100%)",
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
    title: "Ebony",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.01) 24%, rgb(0 0 0 / 0.28)), linear-gradient(91deg, rgb(90 80 68 / 0.08) 0%, rgb(35 30 28 / 0.22) 18%, rgb(82 73 63 / 0.06) 34%, rgb(24 22 22 / 0.24) 51%, rgb(70 63 55 / 0.08) 68%, rgb(18 18 19 / 0.26) 100%), linear-gradient(to right, rgb(45 41 40) 0%, rgb(28 26 27) 22%, rgb(18 18 19) 48%, rgb(26 25 25) 72%, rgb(42 37 35) 100%)",
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
    title: "Pau Ferro",
    config: {
      background:
        "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.22)), linear-gradient(91deg, rgb(186 126 78 / 0.08) 0%, rgb(110 71 45 / 0.16) 15%, rgb(201 141 89 / 0.06) 29%, rgb(88 57 38 / 0.18) 46%, rgb(171 116 72 / 0.08) 62%, rgb(84 54 37 / 0.18) 79%, rgb(148 98 61 / 0.08) 100%), linear-gradient(to right, rgb(154 99 63) 0%, rgb(126 79 49) 19%, rgb(102 63 41) 42%, rgb(122 75 49) 64%, rgb(92 56 37) 84%, rgb(138 88 58) 100%)",
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
