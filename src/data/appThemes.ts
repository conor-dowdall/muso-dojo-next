export const appThemeNames = ["dark", "light", "ocean", "purple"] as const;

export type AppThemeName = (typeof appThemeNames)[number];
export type AppThemeChoice = "system" | AppThemeName;

export interface AppThemeOption {
  id: AppThemeChoice;
  label: string;
}

export const DEFAULT_APP_THEME_CHOICE = "system" satisfies AppThemeChoice;

export const appThemeOptions = [
  {
    id: "system",
    label: "System",
  },
  {
    id: "dark",
    label: "Dark",
  },
  {
    id: "light",
    label: "Light",
  },
  {
    id: "ocean",
    label: "Ocean",
  },
  {
    id: "purple",
    label: "Purple",
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
    ? "Follow system Dojo theme"
    : `Use ${option.label} Dojo theme`;
}
