import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "./instrument-active-note";
import { type InstrumentLayoutConfig } from "./instrument-layout";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "./instrument-note-emphasis";

export type {
  ActiveNote,
  ActiveNotes,
  ActiveNotesSetter,
  ActiveNotesValue,
} from "./instrument-active-note";
export type {
  InstrumentIntrinsicSizing,
  InstrumentLayoutConfig,
  InstrumentSize,
  InstrumentWidthMode,
  ResolvedInstrumentLayoutConfig,
} from "./instrument-layout";
export type {
  InstrumentNoteCellInfo,
  InstrumentNoteCellWrapperProps,
} from "./instrument-note-cell";
export type {
  InstrumentNoteEmphasis,
  InstrumentNoteEmphasisSetter,
} from "./instrument-note-emphasis";

export interface InstrumentNotesLayerProps {
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: ActiveNotesSetter;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  /** When true, note labels display MIDI note numbers instead of the active display format (note names, intervals, etc.) */
  showMidiNumbers?: boolean;
}

export interface InstrumentComponentProps extends InstrumentNotesLayerProps {
  layout?: InstrumentLayoutConfig;
  displayFormatId?: DisplayFormatId;
  initialDisplayFormatId?: DisplayFormatId;
  onDisplayFormatIdChange?: DisplayFormatSetter;
  noteEmphasis?: InstrumentNoteEmphasis;
  initialNoteEmphasis?: InstrumentNoteEmphasis;
  onNoteEmphasisChange?: InstrumentNoteEmphasisSetter;
  showHeader?: boolean;
  onClone?: () => void;
  onRemove?: () => void;
}

export interface InstrumentPresentation {
  activeDisplayFormatId: DisplayFormatId;
  setActiveDisplayFormatId: DisplayFormatSetter;
  noteEmphasis: InstrumentNoteEmphasis;
  setNoteEmphasis: InstrumentNoteEmphasisSetter;
  emphasisResetKey: number;
  resetNotes: () => void;
  isModified: boolean;
  setIsModified: (isModified: boolean) => void;
}
