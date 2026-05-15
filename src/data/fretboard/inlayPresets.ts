import { type FretboardConfig } from "@/types/fretboard";

export interface FretboardInlayPreset {
  title: string;
  config: FretboardConfig;
}

export const fretboardInlayPresets = {
  auto: {
    title: "Auto",
    config: {},
  },
  none: {
    title: "None",
    config: {
      showFretInlays: false,
    },
  },
  dots: {
    title: "Dots",
    config: {
      showFretInlays: true,
      fretInlayImage: "circle",
      fretInlayImages: {},
      fretInlayDoubles: [12, 24],
    },
  },
  pawPrint: {
    title: "Paw Print",
    config: {
      showFretInlays: true,
      fretInlayImage: "paw-print",
      fretInlayImages: {},
      fretInlayDoubles: [12, 24],
    },
  },
  trapezoid: {
    title: "Classic",
    config: {
      showFretInlays: true,
      fretInlayImage: "trapezoid",
      fretInlayWidth: "65cqi",
      fretInlayHeight: "80cqh",
      fretInlayImages: {},
      fretInlayDoubles: [],
    },
  },
} as const satisfies Record<string, FretboardInlayPreset>;

export const DEFAULT_FRETBOARD_INLAY_PRESET =
  "auto" satisfies FretboardInlayPresetName;

export type FretboardInlayPresetName = keyof typeof fretboardInlayPresets;
export type CustomFretboardInlayPresetName = Exclude<
  FretboardInlayPresetName,
  typeof DEFAULT_FRETBOARD_INLAY_PRESET
>;

export const fretboardInlayPresetOptions = Object.keys(
  fretboardInlayPresets,
) as FretboardInlayPresetName[];

export const customFretboardInlayPresetOptions =
  fretboardInlayPresetOptions.filter(
    (presetName): presetName is CustomFretboardInlayPresetName =>
      presetName !== DEFAULT_FRETBOARD_INLAY_PRESET,
  );

export const DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET =
  "dots" satisfies CustomFretboardInlayPresetName;
