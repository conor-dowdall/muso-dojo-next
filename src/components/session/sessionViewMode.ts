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
  },
  band: {
    label: "Chart",
  },
  "live-part": {
    label: "Live",
  },
  focus: {
    label: "Clean",
  },
} as const satisfies Record<
  SessionViewMode,
  {
    label: string;
  }
>;

export function requiresSessionParts(mode: SessionViewMode) {
  return mode === "band" || mode === "live-part" || mode === "focus";
}
