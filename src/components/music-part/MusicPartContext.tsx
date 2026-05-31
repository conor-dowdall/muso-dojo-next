"use client";

import { createContext, type ReactNode, use } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import { type AddPartModuleHandler } from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";

export interface MusicPartContextValue {
  partId: string;
  moduleCount: number;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  setRootNote: SettingSetter<string>;
  setNoteCollectionKey: SettingSetter<NoteCollectionKey>;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  addPartModule?: AddPartModuleHandler;
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
