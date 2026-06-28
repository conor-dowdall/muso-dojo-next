export const sessionViewModes = [
  "session",
  "band",
  "live-part",
  "focus",
] as const;

export type SessionViewMode = (typeof sessionViewModes)[number];

export const sessionViewModeCopy = {
  session: {
    label: "Session",
    subtitle: "Show the full workspace.",
  },
  band: {
    label: "Band",
    subtitle: "Show the Part sequence as the main view.",
  },
  "live-part": {
    label: "Live Part",
    subtitle: "Show the current Part as the main view.",
  },
  focus: {
    label: "Focus",
    subtitle: "Hide editing controls for practice.",
  },
} as const satisfies Record<
  SessionViewMode,
  {
    label: string;
    subtitle: string;
  }
>;

export function requiresSessionParts(mode: SessionViewMode) {
  return mode === "band" || mode === "live-part";
}
