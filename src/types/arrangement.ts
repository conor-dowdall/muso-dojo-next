import {
  type MusicPartConfig,
  type SessionBackingBandConfig,
} from "@/types/session";

export type ArrangementPlaybackMode = "once" | "loop";

export const arrangementWorkspaceViewModes = ["build", "chart"] as const;
export type ArrangementWorkspaceViewMode =
  (typeof arrangementWorkspaceViewModes)[number];

export function isArrangementWorkspaceViewMode(
  value: unknown,
): value is ArrangementWorkspaceViewMode {
  return arrangementWorkspaceViewModes.some((mode) => mode === value);
}

export const MIN_ARRANGEMENT_ENTRY_PLAY_COUNT = 1;
export const MAX_ARRANGEMENT_ENTRY_PLAY_COUNT = 16;

export interface ArrangementSectionSource {
  sessionId: string;
  sessionName: string;
  sessionLastModified: string;
  sessionTempoBpm: number;
  capturedAt: string;
}

export interface ArrangementSectionConfig {
  id: string;
  source: ArrangementSectionSource;
  backingBand: SessionBackingBandConfig;
  parts: MusicPartConfig[];
}

export interface ArrangementEntryConfig {
  id: string;
  sectionId: string;
  playCount: number;
  tempoOverrideBpm?: number;
}

export interface ArrangementConfig {
  id: string;
  name: string;
  lastModified: string;
  tempoBpm: number;
  playbackMode: ArrangementPlaybackMode;
  sections: ArrangementSectionConfig[];
  entries: ArrangementEntryConfig[];
  workspaceViewMode: ArrangementWorkspaceViewMode;
}

export type ActiveWorkspaceRef =
  { kind: "session"; id: string } | { kind: "arrangement"; id: string } | null;
