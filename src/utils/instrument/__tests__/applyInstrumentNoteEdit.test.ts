import { describe, expect, it } from "vitest";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { applyInstrumentNoteEdit } from "@/utils/instrument/applyInstrumentNoteEdit";

describe("applyInstrumentNoteEdit", () => {
  it("applies a pitch-class edit to every matching target and leaves other notes alone", () => {
    const c4 = {
      key: "c4",
      midi: 60,
      pitchClass: 0,
    } satisfies InstrumentNoteInteractionTarget;
    const c5 = {
      key: "c5",
      midi: 72,
      pitchClass: 0,
    } satisfies InstrumentNoteInteractionTarget;
    const d4 = {
      key: "d4",
      midi: 62,
      pitchClass: 2,
    } satisfies InstrumentNoteInteractionTarget;
    const activeNotes = {
      d4: { midi: d4.midi, emphasis: "small" },
    } satisfies ActiveNotes;

    const result = applyInstrumentNoteEdit({
      activeNotes,
      allTargets: [c4, c5, d4],
      scope: "pitch-class",
      target: c4,
    });

    expect(result).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
      c5: { midi: c5.midi, emphasis: "large" },
      d4: activeNotes.d4,
    });
  });
});
