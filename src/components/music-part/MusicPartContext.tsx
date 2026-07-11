"use client";

import { createContext, type ReactNode, use } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import {
  type AddPartModulesHandler,
  type AutomaticRhythmStyle,
  type PartBandConfig,
  type PartBandRole,
  type PartBandSourceConfig,
  type PartLengthMode,
} from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { type PartBandModuleOption } from "@/types/music-part";

export interface MusicPartContextValue {
  partId: string;
  lengthBeats: number;
  effectiveLengthBeats: number;
  lengthMode: PartLengthMode;
  band: PartBandConfig;
  automaticRhythm: AutomaticRhythmStyle;
  bandModuleOptions: Record<PartBandRole, PartBandModuleOption[]>;
  moduleCount: number;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  setRootNote: SettingSetter<string>;
  setNoteCollectionKey: SettingSetter<NoteCollectionKey>;
  setLengthBeats?: SettingSetter<number>;
  setLengthMode?: (value: PartLengthMode) => void;
  setBandSource?: (role: PartBandRole, source: PartBandSourceConfig) => void;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  addPartModules?: AddPartModulesHandler;
  clonePart?: () => void;
  removePart?: () => void;
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
