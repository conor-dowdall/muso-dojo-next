import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type ReactNode } from "react";
import { type AudioPresetId } from "@/audio/types";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import { type SettingSetter } from "@/types/state";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "./instrument-active-note";
import { type InstrumentLayoutConfig } from "./instrument-layout";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "./instrument-note-emphasis";
import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionModeSetter,
} from "./instrument-note-interaction";

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
export type {
  InstrumentNoteInteractionMode,
  InstrumentNoteInteractionModeSetter,
  InstrumentNoteInteractionTarget,
} from "./instrument-note-interaction";

export interface InstrumentNotesLayerProps {
  activeNotes?: ActiveNotes;
  activeNotesLocked?: boolean;
  activeNotesLockPreservesEdits?: boolean;
  audioPresetId?: AudioPresetId;
  onActiveNotesChange?: ActiveNotesSetter;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
}

export interface InstrumentFrameProps {
  children: ReactNode;
  audioPresetId?: AudioPresetId;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  layout?: InstrumentLayoutConfig;
  displayFormatId?: DisplayFormatId;
  activeNotesLocked?: boolean;
  onActiveNotesLockChange?: (
    activeNotesLocked: boolean,
    activeNotesSnapshot?: ActiveNotes,
    activeNotesLockPreservesEdits?: boolean,
  ) => void;
  initialDisplayFormatId?: DisplayFormatId;
  onDisplayFormatIdChange?: DisplayFormatSetter;
  noteEmphasis?: InstrumentNoteEmphasis;
  initialNoteEmphasis?: InstrumentNoteEmphasis;
  onNoteEmphasisChange?: InstrumentNoteEmphasisSetter;
  noteInteractionMode?: InstrumentNoteInteractionMode;
  initialNoteInteractionMode?: InstrumentNoteInteractionMode;
  onNoteInteractionModeChange?: InstrumentNoteInteractionModeSetter;
  showHeader?: boolean;
  onClone?: () => void;
  onRemove?: () => void;
}

export interface InstrumentPresentation {
  activeDisplayFormatId: DisplayFormatId;
  setActiveDisplayFormatId: DisplayFormatSetter;
  noteEmphasis: InstrumentNoteEmphasis;
  setNoteEmphasis: InstrumentNoteEmphasisSetter;
  noteInteractionMode: InstrumentNoteInteractionMode;
  setNoteInteractionMode: InstrumentNoteInteractionModeSetter;
  emphasisResetKey: number;
  resetNotes: () => void;
  isModified: boolean;
  setIsModified: (isModified: boolean) => void;
  getActiveNotesLockSnapshot: () => ActiveNotes | null;
  setActiveNotesLockSnapshot: (snapshot: ActiveNotes) => void;
}
