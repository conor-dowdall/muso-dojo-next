import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";

export interface MusicPartSettings {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  showHeader?: boolean;
}

export interface MusicPartControlProps {
  rootNote?: string;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  noteCollectionKey?: NoteCollectionKey;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
