import { type SessionViewMode } from "@/types/session-view";

export {
  isSessionFocusViewMode,
  isSessionWorkspaceViewMode,
  requiresSessionParts,
  sessionFocusViewModes,
  sessionViewModes,
  sessionWorkspaceViewModes,
  type SessionFocusViewMode,
  type SessionViewMode,
  type SessionWorkspaceViewMode,
} from "@/types/session-view";

export const sessionViewModeConfig = {
  session: {
    label: "Session",
    showsChart: false,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: false,
  },
  chart: {
    label: "Chart",
    showsChart: true,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: false,
  },
  live: {
    label: "Live",
    showsChart: false,
    showsOnlyLivePart: true,
    usesReadOnlyPartChrome: true,
  },
  clean: {
    label: "Clean",
    showsChart: false,
    showsOnlyLivePart: false,
    usesReadOnlyPartChrome: true,
  },
} as const satisfies Record<
  SessionViewMode,
  {
    label: string;
    showsChart: boolean;
    showsOnlyLivePart: boolean;
    usesReadOnlyPartChrome: boolean;
  }
>;

export function showsSessionChart(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].showsChart;
}

export function showsOnlyLivePart(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].showsOnlyLivePart;
}

export function usesReadOnlyPartChrome(mode: SessionViewMode) {
  return sessionViewModeConfig[mode].usesReadOnlyPartChrome;
}
