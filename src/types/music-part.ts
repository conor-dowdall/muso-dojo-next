import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";

export type MusicPartLayout = "column" | "row";

export interface MusicPartSettings {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  layout?: MusicPartLayout;
  showHeader?: boolean;
}

export interface MusicPartControlProps {
  layout?: MusicPartLayout;
  onLayoutChange?: SettingSetter<MusicPartLayout>;
  rootNote?: string;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  noteCollectionKey?: NoteCollectionKey;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
