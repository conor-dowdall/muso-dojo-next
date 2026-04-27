import { type KeyboardConfig } from "@/types/keyboard";

type KeyboardThemeConfig = Required<
  Pick<
    KeyboardConfig,
    | "whiteKeyColor"
    | "blackKeyColor"
    | "whiteKeyTextColor"
    | "blackKeyTextColor"
    | "whiteKeyBorderColor"
    | "blackKeyBorderColor"
    | "keyBorderRadius"
    | "whiteKeyShadow"
    | "blackKeyShadow"
  >
>;

export interface KeyboardTheme {
  title: string;
  summary: string;
  config: KeyboardThemeConfig;
}

export const keyboardThemes = {
  classic: {
    title: "Classic",
    summary: "Warm ivory and charcoal",
    config: {
      whiteKeyColor:
        "linear-gradient(to bottom, #fffaf0 0%, #f3ead9 58%, #e3d7c4 100%)",
      blackKeyColor:
        "linear-gradient(to bottom, #34312d 0%, #171513 58%, #050505 100%)",
      whiteKeyTextColor: "#211b14",
      blackKeyTextColor: "#f5efe6",
      whiteKeyBorderColor: "rgb(136 122 101 / 0.68)",
      blackKeyBorderColor: "rgb(0 0 0 / 0.86)",
      keyBorderRadius: "0 0 5px 5px",
      whiteKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.78), inset 0 -7px 10px rgb(88 69 43 / 0.14), 1px 0 0 rgb(255 255 255 / 0.24)",
      blackKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 -8px 10px rgb(0 0 0 / 0.44), 0 3px 5px rgb(0 0 0 / 0.38)",
    },
  },
  studio: {
    title: "Studio",
    summary: "Cool whites and graphite",
    config: {
      whiteKeyColor:
        "linear-gradient(to bottom, #f7f8f5 0%, #e8ece8 56%, #d5dcd7 100%)",
      blackKeyColor:
        "linear-gradient(to bottom, #293039 0%, #12171d 60%, #06080a 100%)",
      whiteKeyTextColor: "#182022",
      blackKeyTextColor: "#eef4f2",
      whiteKeyBorderColor: "rgb(105 119 120 / 0.68)",
      blackKeyBorderColor: "rgb(2 6 9 / 0.9)",
      keyBorderRadius: "0 0 4px 4px",
      whiteKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.72), inset 0 -7px 9px rgb(36 48 48 / 0.12), 1px 0 0 rgb(255 255 255 / 0.22)",
      blackKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.16), inset 0 -8px 10px rgb(0 0 0 / 0.46), 0 3px 5px rgb(0 0 0 / 0.42)",
    },
  },
  inverted: {
    title: "Inverted",
    summary: "Dark naturals, pale sharps",
    config: {
      whiteKeyColor:
        "linear-gradient(to bottom, #373633 0%, #242422 58%, #151514 100%)",
      blackKeyColor: "linear-gradient(to bottom, #f7f0df 0%, #d9cfbb 100%)",
      whiteKeyTextColor: "#f7f0df",
      blackKeyTextColor: "#1c1813",
      whiteKeyBorderColor: "rgb(0 0 0 / 0.62)",
      blackKeyBorderColor: "rgb(117 101 76 / 0.72)",
      keyBorderRadius: "0 0 5px 5px",
      whiteKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 -7px 10px rgb(0 0 0 / 0.28), 1px 0 0 rgb(255 255 255 / 0.08)",
      blackKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.72), inset 0 -7px 9px rgb(74 57 34 / 0.16), 0 3px 5px rgb(0 0 0 / 0.18)",
    },
  },
  softFocus: {
    title: "Soft Focus",
    summary: "Muted keys for overlays",
    config: {
      whiteKeyColor:
        "linear-gradient(to bottom, #eee7d8 0%, #ded4c1 58%, #cfc2ac 100%)",
      blackKeyColor:
        "linear-gradient(to bottom, #5a554f 0%, #3a3733 62%, #242220 100%)",
      whiteKeyTextColor: "#252018",
      blackKeyTextColor: "#f0e7d6",
      whiteKeyBorderColor: "rgb(126 111 86 / 0.54)",
      blackKeyBorderColor: "rgb(24 21 18 / 0.74)",
      keyBorderRadius: "0 0 5px 5px",
      whiteKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.52), inset 0 -6px 8px rgb(82 65 43 / 0.1), 1px 0 0 rgb(255 255 255 / 0.16)",
      blackKeyShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), inset 0 -7px 9px rgb(0 0 0 / 0.28), 0 2px 4px rgb(0 0 0 / 0.24)",
    },
  },
} as const satisfies Record<string, KeyboardTheme>;

export type KeyboardThemeName = keyof typeof keyboardThemes;

export const DEFAULT_KEYBOARD_THEME = "classic" satisfies KeyboardThemeName;

export function normalizeKeyboardThemeName(
  value: unknown,
): KeyboardThemeName | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value in keyboardThemes) {
    return value as KeyboardThemeName;
  }

  return undefined;
}
