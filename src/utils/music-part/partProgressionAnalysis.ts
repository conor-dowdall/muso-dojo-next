import { resolvePracticalRootNote } from "@musodojo/music-theory-data";
import { type MusicPartConfig } from "@/types/session";

/**
 * Returns authored analysis only while the Part still has its generated
 * harmonic identity. Rhythm, duration, module, and ordering edits do not
 * change a chord's tonic-relative function.
 */
export function getValidAuthoredRomanSymbol(part: MusicPartConfig) {
  const authored = part.authoredProgression;

  return authored &&
    part.rootNote === resolvePracticalRootNote(authored.rootNote) &&
    part.noteCollectionKey === authored.noteCollectionKey
    ? authored.romanSymbol
    : undefined;
}
