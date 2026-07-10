export const sessionViewModes = ["session", "chart", "live", "clean"] as const;
export const sessionWorkspaceViewModes = ["session", "chart"] as const;
export const sessionFocusViewModes = ["live", "clean"] as const;

export type SessionViewMode = (typeof sessionViewModes)[number];
export type SessionWorkspaceViewMode =
  (typeof sessionWorkspaceViewModes)[number];
export type SessionFocusViewMode = (typeof sessionFocusViewModes)[number];

export function isSessionViewMode(value: unknown): value is SessionViewMode {
  return sessionViewModes.some((mode) => mode === value);
}

export function isSessionWorkspaceViewMode(
  value: unknown,
): value is SessionWorkspaceViewMode {
  return sessionWorkspaceViewModes.some((mode) => mode === value);
}

export function isSessionFocusViewMode(
  value: unknown,
): value is SessionFocusViewMode {
  return sessionFocusViewModes.some((mode) => mode === value);
}

export function requiresSessionParts(mode: SessionViewMode) {
  return mode !== "session";
}

export function resolveAvailableSessionWorkspaceViewMode(
  mode: SessionWorkspaceViewMode,
  partCount: number,
): SessionWorkspaceViewMode {
  return requiresSessionParts(mode) && partCount === 0 ? "session" : mode;
}
