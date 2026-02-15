import { type FretboardPresetName } from "@/configs/fretboard/presets";
import { type FretboardIcon } from "@/configs/fretboard/icons";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";

export type FretboardNoteLabelType =
  | "midi"
  | "note-name"
  | "interval"
  | "solfege";

export interface FretboardConfig {
  // Setup
  tuning?: readonly number[];
  fretRange?: [number, number];
  leftHanded?: boolean;

  // Fretboard Design
  background?: string;
  markerFrets?: readonly number[]; // used for fret inlay-and-label positions

  // Fret Markers
  showFretInlays?: boolean;
  fretInlayColor?: string;
  fretInlayWidth?: string;
  fretInlayHeight?: string;
  fretInlayImage?: FretboardIcon;
  fretInlayImages?: Record<number, FretboardIcon>;
  fretInlayDoubles?: readonly number[];
  fretInlayDoubleGap?: string;

  // Fret Labels
  showFretLabels?: boolean;
  fretLabelsPosition?: "top" | "bottom";
  fretLabelsBackground?: string;
  fretLabelsHeight?: string;
  fretLabelColor?: string;
  fretLabelMode?: "number" | "image";
  fretLabelImage?: FretboardIcon;
  fretLabelImages?: Record<number, FretboardIcon>;
  fretLabelDoubles?: readonly number[];
  fretLabelDoubleGap?: string;

  // Nut
  showNut?: boolean;
  nutColor?: string;
  nutWidth?: string;

  // Frets
  evenFrets?: boolean;
  showFretWires?: boolean;
  fretWireColor?: string;
  fretWireWidth?: string;

  // Strings
  showStrings?: boolean;
  stringColor?: string;
  stringColors?: Record<number, string>;
  stringWidth?: string;
  stringWidths?: Record<number, string>;
}

export interface ActiveNote {
  midi: number;
  emphasis: "large" | "small";
}

export type ActiveNotes = Record<string, ActiveNote>; // Keyed by `${stringNumber}-${fretNumber}`

export interface FretboardProps extends Partial<FretboardConfig> {
  config?: FretboardConfig;
  preset?: FretboardPresetName;
  /**
   * The root note of the scale/mode/chord/arpeggio.
   * Accepts formatted RootNotes (e.g. "C♯") or common strings (e.g. "C#", "Db") which are normalized.
   */
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  noteLabelType?: FretboardNoteLabelType;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
}
