export const sessionViewModes = ["session", "chart", "live", "clean"] as const;

export type SessionViewMode = (typeof sessionViewModes)[number];

export const sessionViewModeConfig = {
  session: {
    label: "Session",
    requiresParts: false,
    showsChart: false,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: false,
  },
  chart: {
    label: "Chart",
    requiresParts: true,
    showsChart: true,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: false,
  },
  live: {
    label: "Live",
    requiresParts: true,
    showsChart: false,
    showsOnlyLivePart: true,
    usesReadOnlyPartChrome: true,
  },
  clean: {
    label: "Clean",
    requiresParts: true,
    showsChart: false,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: true,
  },
} as const satisfies Record<
  SessionViewMode,
  {
    label: string;
    requiresParts: boolean;
    showsChart: boolean;
    showsOnlyLivePart: boolean;
    usesReadOnlyPartChrome: boolean;
  }
>;

export function requiresSessionParts(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].requiresParts;
}

export function isPracticeSessionViewMode(mode: SessionViewMode) {
  return mode !== "session";
}

export function showsSessionChart(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].showsChart;
}

export function showsOnlyLivePart(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].showsOnlyLivePart;
}

export function usesReadOnlyPartChrome(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].usesReadOnlyPartChrome;
}
