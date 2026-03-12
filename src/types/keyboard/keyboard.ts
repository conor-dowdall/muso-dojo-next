import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import {
  type ActiveNotes,
  type NoteLabelType,
} from "@/types/instrument/shared";
import { type KeyboardPresetName } from "@/configs/keyboard/presets";

export interface KeyboardConfig {
  /** MIDI note range [startMidi, endMidi] inclusive. Default: [48, 72] (C3–C5) */
  midiRange?: [number, number];

  /** Background color of white keys */
  whiteKeyColor?: string;
  /** Background color of black keys */
  blackKeyColor?: string;

  /** Text color on white keys */
  whiteKeyTextColor?: string;
  /** Text color on black keys */
  blackKeyTextColor?: string;

  /** Border color for keys */
  keyBorderColor?: string;
  /** Border radius for keys */
  keyBorderRadius?: string;

  /** Whether to show note labels on keys */
  showKeyLabels?: boolean;

  /** Overall background behind the keyboard */
  background?: string;

  /** Black key height as a percentage of total keyboard height */
  blackKeyHeightPercent?: number;
  /** Black key width as a fraction of white key width */
  blackKeyWidthRatio?: number;
}

export interface KeyboardProps {
  preset?: KeyboardPresetName;
  config?: KeyboardConfig;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  noteLabelType?: NoteLabelType;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
  showToolbar?: boolean;
}
