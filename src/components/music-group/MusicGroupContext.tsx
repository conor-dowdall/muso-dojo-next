"use client";

import { createContext, type ReactNode, use } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";
import { type AddInstrumentHandler } from "@/types/workspace";

export interface MusicGroupContextValue {
  groupId: string;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  setRootNote: SettingSetter<string>;
  setNoteCollectionKey: SettingSetter<NoteCollectionKey>;
  addInstrument?: AddInstrumentHandler;
  cloneGroup?: () => void;
  removeGroup?: () => void;
}

const MusicGroupContext = createContext<MusicGroupContextValue | null>(null);

export function MusicGroupProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MusicGroupContextValue;
}) {
  return <MusicGroupContext value={value}>{children}</MusicGroupContext>;
}

export function useOptionalMusicGroup() {
  return use(MusicGroupContext);
}

export function useMusicGroup() {
  const context = use(MusicGroupContext);
  if (!context) {
    throw new Error("useMusicGroup must be used within a MusicGroup");
  }
  return context;
}
