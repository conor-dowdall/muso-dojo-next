import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";

export type MusicGroupLayout = "column" | "row";

export interface MusicGroupSettings {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  accentColor?: string;
  layout?: MusicGroupLayout;
  showHeader?: boolean;
}

export interface MusicGroupControlProps {
  rootNote?: string;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  noteCollectionKey?: NoteCollectionKey;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
