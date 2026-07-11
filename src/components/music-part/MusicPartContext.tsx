"use client";

import { createContext, type ReactNode, use } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import {
  type AddPartModulesHandler,
  type AutomaticRhythmConfig,
  type PartBandConfig,
  type PartBandRole,
  type PartBandSourceConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { type PartBandModuleOption } from "@/types/music-part";

export interface MusicPartContextValue {
  sessionId?: string;
  partId: string;
  automaticLengthBeats: number;
  effectiveLengthBeats: number;
  band: PartBandConfig;
  automaticRhythm: AutomaticRhythmConfig;
  bandModuleOptions: Record<PartBandRole, PartBandModuleOption[]>;
  moduleCount: number;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  setRootNote: SettingSetter<string>;
  setNoteCollectionKey: SettingSetter<NoteCollectionKey>;
  setBandSource?: (role: PartBandRole, source: PartBandSourceConfig) => void;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  addPartModules?: AddPartModulesHandler;
  clonePart?: () => void;
  removePart?: () => void;
  sessionBackingBand: SessionBackingBandConfig;
}

const MusicPartContext = createContext<MusicPartContextValue | null>(null);

export function MusicPartProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MusicPartContextValue;
}) {
  return <MusicPartContext value={value}>{children}</MusicPartContext>;
}

export function useOptionalMusicPart() {
  return use(MusicPartContext);
}

export function useMusicPart() {
  const context = use(MusicPartContext);
  if (!context) {
    throw new Error("useMusicPart must be used within a MusicPart");
  }
  return context;
}
