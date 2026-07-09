import { type StringInstrumentKey } from "@musodojo/music-theory-data";

export interface SavedFretboardTuning {
  id: string;
  instrument: StringInstrumentKey;
  name: string;
  /** Open strings in conventional musician-facing order. */
  openMidiNotes: readonly number[];
}

export interface SavedFretboardTuningInput {
  instrument: StringInstrumentKey;
  name: string;
  openMidiNotes: readonly number[];
}
