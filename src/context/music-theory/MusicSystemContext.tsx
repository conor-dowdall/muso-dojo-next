"use client";

import { createContext, use, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";

interface MusicSystemContextValue {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  setRootNote: (note: string) => void;
  setNoteCollectionKey: (key: NoteCollectionKey) => void;
}

const MusicSystemContext = createContext<MusicSystemContextValue | null>(null);

interface MusicSystemProviderProps {
  children: React.ReactNode;
  initialRootNote?: string;
  initialNoteCollectionKey?: NoteCollectionKey;
}

export function MusicSystemProvider({
  children,
  initialRootNote = "C",
  initialNoteCollectionKey = "major",
}: MusicSystemProviderProps) {
  const [rootNote, setRootNote] = useState(initialRootNote);
  const [noteCollectionKey, setNoteCollectionKey] = useState<NoteCollectionKey>(
    initialNoteCollectionKey,
  );

  const value = {
    rootNote,
    noteCollectionKey,
    setRootNote,
    setNoteCollectionKey,
  };

  return (
    <MusicSystemContext.Provider value={value}>
      {children}
    </MusicSystemContext.Provider>
  );
}

export function useMusicSystem() {
  const context = use(MusicSystemContext);
  return context;
}
