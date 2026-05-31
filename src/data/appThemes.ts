export const appThemeNames = ["dark", "light", "ocean", "purple"] as const;

export type AppThemeName = (typeof appThemeNames)[number];
export type AppThemeChoice = "system" | AppThemeName;

export interface AppThemeOption {
  id: AppThemeChoice;
  label: string;
  swatch: readonly [string, string, string];
}

export const DEFAULT_APP_THEME_CHOICE = "system" satisfies AppThemeChoice;

export const appThemeOptions = [
  {
    id: "system",
    label: "System",
    swatch: ["#0b0c10", "#d7dce5", "#fafafa"],
  },
  {
    id: "dark",
    label: "Dark",
    swatch: ["#08090d", "#17191f", "#d4d9e2"],
  },
  {
    id: "light",
    label: "Light",
    swatch: ["#fbfbfd", "#e7ebf1", "#334155"],
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: ["#06131e", "#12354a", "#5eead4"],
  },
  {
    id: "purple",
    label: "Purple",
    swatch: ["#140f22", "#312047", "#c084fc"],
  },
] as const satisfies readonly AppThemeOption[];

const appThemeNameSet = new Set<AppThemeName>(appThemeNames);

export function isAppThemeName(value: unknown): value is AppThemeName {
  return (
    typeof value === "string" && appThemeNameSet.has(value as AppThemeName)
  );
}

export function normalizeAppThemePreference(
  value: unknown,
): AppThemeName | undefined {
  return isAppThemeName(value) ? value : undefined;
}

export function getAppThemeChoice(
  preference: AppThemeName | undefined,
): AppThemeChoice {
  return preference ?? DEFAULT_APP_THEME_CHOICE;
}

export function getAppThemeOption(choice: AppThemeChoice): AppThemeOption {
  return (
    appThemeOptions.find((option) => option.id === choice) ?? appThemeOptions[0]
  );
}

export function getAppThemeLabel(choice: AppThemeChoice) {
  return getAppThemeOption(choice).label;
}

export function getAppThemeAriaLabel(option: AppThemeOption) {
  return option.id === DEFAULT_APP_THEME_CHOICE
    ? "Follow system theme"
    : `Use ${option.label} theme`;
}
