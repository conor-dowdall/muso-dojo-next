import {
  type ChordProgression,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";

export interface SavedChordProgression {
  id: string;
  name: string;
  progression: ChordProgression;
}

export interface SavedChordProgressionInput {
  name: string;
  progression: ChordProgression;
}

export type ChordProgressionSelection =
  | { kind: "built-in"; progressionKey: ChordProgressionKey }
  | { kind: "custom"; progressionId: string };
