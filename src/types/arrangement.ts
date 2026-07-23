import {
  type MusicPartConfig,
  type SessionBackingBandConfig,
} from "@/types/session";

export type ArrangementPlaybackMode = "once" | "loop";

export interface ArrangementSectionSource {
  sessionId: string;
  sessionName: string;
  sessionLastModified: string;
  sessionTempoBpm: number;
  capturedAt: string;
}

export interface ArrangementSectionConfig {
  id: string;
  name: string;
  source: ArrangementSectionSource;
  backingBand: SessionBackingBandConfig;
  parts: MusicPartConfig[];
}

export interface ArrangementEntryConfig {
  id: string;
  sectionId: string;
  playCount: number;
}

export interface ArrangementConfig {
  id: string;
  name: string;
  lastModified: string;
  tempoBpm: number;
  playbackMode: ArrangementPlaybackMode;
  sections: ArrangementSectionConfig[];
  entries: ArrangementEntryConfig[];
}

export type ActiveWorkspaceRef =
  { kind: "session"; id: string } | { kind: "arrangement"; id: string } | null;
