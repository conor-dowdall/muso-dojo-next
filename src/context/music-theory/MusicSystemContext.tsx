"use client";

import { createContext, use, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";

interface MusicSystemContextValue {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  activeConversionId: string;
  noteEmphasis: "large" | "small" | "hidden";
  setRootNote: (note: string) => void;
  setNoteCollectionKey: (key: NoteCollectionKey) => void;
  setActiveConversionId: (id: string) => void;
  setNoteEmphasis: (emphasis: "large" | "small" | "hidden") => void;
}

const MusicSystemContext = createContext<MusicSystemContextValue | null>(null);

interface MusicSystemProviderProps {
  children: React.ReactNode;
  initialRootNote?: string;
  initialNoteCollectionKey?: NoteCollectionKey;
  initialActiveConversionId?: string;
  initialNoteEmphasis?: "large" | "small" | "hidden";
}

export function MusicSystemProvider({
  children,
  initialRootNote = "C",
  initialNoteCollectionKey = "major",
  initialActiveConversionId = "note-names",
  initialNoteEmphasis = "large",
}: MusicSystemProviderProps) {
  const [rootNote, setRootNote] = useState(initialRootNote);
  const [noteCollectionKey, setNoteCollectionKey] = useState<NoteCollectionKey>(
    initialNoteCollectionKey,
  );
  const [activeConversionId, setActiveConversionId] = useState<string>(
    initialActiveConversionId,
  );
  const [noteEmphasis, setNoteEmphasis] = useState<"large" | "small" | "hidden">(
    initialNoteEmphasis,
  );

  const value = {
    rootNote,
    noteCollectionKey,
    activeConversionId,
    noteEmphasis,
    setRootNote,
    setNoteCollectionKey,
    setActiveConversionId,
    setNoteEmphasis,
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
