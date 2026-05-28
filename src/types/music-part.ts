import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type SettingSetter } from "@/types/state";

export interface MusicPartInstrumentSettings {
  id: string;
  displayFormatId: DisplayFormatId;
  noteEmphasis: InstrumentNoteEmphasis;
}

export interface MusicPartSettings {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  showHeader?: boolean;
}

export interface MusicPartControlProps {
  instrumentSettings?: readonly MusicPartInstrumentSettings[];
  onPartDisplayFormatIdChange?: (displayFormatId: DisplayFormatId) => void;
  onPartNoteEmphasisChange?: (noteEmphasis: InstrumentNoteEmphasis) => void;
  rootNote?: string;
  initialRootNote?: string;
  onRootNoteChange?: SettingSetter<string>;
  noteCollectionKey?: NoteCollectionKey;
  initialNoteCollectionKey?: NoteCollectionKey;
  onNoteCollectionKeyChange?: SettingSetter<NoteCollectionKey>;
}
