import {
  type OpenStringMidiNotes,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";

export interface SavedFretboardTuning {
  id: string;
  instrument: StringInstrumentKey;
  name: string;
  /** Open strings in conventional musician-facing order. */
  openMidiNotes: OpenStringMidiNotes;
}

export interface SavedFretboardTuningInput {
  instrument: StringInstrumentKey;
  name: string;
  openMidiNotes: OpenStringMidiNotes;
}
