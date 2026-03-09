"use client";

import { createContext, use, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";

interface MusicSystemContextValue {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  activeConversionId: string;
  setRootNote: (note: string) => void;
  setNoteCollectionKey: (key: NoteCollectionKey) => void;
  setActiveConversionId: (id: string) => void;
}

const MusicSystemContext = createContext<MusicSystemContextValue | null>(null);

interface MusicSystemProviderProps {
  children: React.ReactNode;
  initialRootNote?: string;
  initialNoteCollectionKey?: NoteCollectionKey;
  initialActiveConversionId?: string;
}

export function MusicSystemProvider({
  children,
  initialRootNote = "C",
  initialNoteCollectionKey = "major",
  initialActiveConversionId = "note-names",
}: MusicSystemProviderProps) {
  const [rootNote, setRootNote] = useState(initialRootNote);
  const [noteCollectionKey, setNoteCollectionKey] = useState<NoteCollectionKey>(
    initialNoteCollectionKey,
  );
  const [activeConversionId, setActiveConversionId] = useState<string>(
    initialActiveConversionId,
  );

  const value = {
    rootNote,
    noteCollectionKey,
    activeConversionId,
    setRootNote,
    setNoteCollectionKey,
    setActiveConversionId,
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
