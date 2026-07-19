import {
  type ChordProgressionDefinition,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";

type CustomChordProgressionDefinition = Pick<
  ChordProgressionDefinition,
  "name" | "progression"
>;

export interface SavedChordProgression extends CustomChordProgressionDefinition {
  id: string;
}

export type SavedChordProgressionInput = CustomChordProgressionDefinition;

export type ChordProgressionSelection =
  | { kind: "built-in"; progressionKey: ChordProgressionKey }
  | { kind: "custom"; progressionId: string };
