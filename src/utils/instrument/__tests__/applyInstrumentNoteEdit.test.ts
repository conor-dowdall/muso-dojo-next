import { describe, expect, it } from "vitest";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { applyInstrumentNoteEdit } from "@/utils/instrument/applyInstrumentNoteEdit";

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
const noteTargets = [c4, c5, d4];

describe("applyInstrumentNoteEdit", () => {
  it("applies a one-note edit only to the clicked target", () => {
    const activeNotes = {
      d4: { midi: d4.midi, emphasis: "small" },
    } satisfies ActiveNotes;

    const result = applyInstrumentNoteEdit({
      activeNotes,
      allTargets: noteTargets,
      scope: "one",
      target: c4,
    });

    expect(result).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
      d4: activeNotes.d4,
    });
  });

  it("applies a pitch-class edit to every matching target and leaves other notes alone", () => {
    const activeNotes = {
      d4: { midi: d4.midi, emphasis: "small" },
    } satisfies ActiveNotes;

    const result = applyInstrumentNoteEdit({
      activeNotes,
      allTargets: noteTargets,
      scope: "pitch-class",
      target: c4,
    });

    expect(result).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
      c5: { midi: c5.midi, emphasis: "large" },
      d4: activeNotes.d4,
    });
  });

  it("removes every matching pitch-class target when the clicked note cycles to hidden", () => {
    const activeNotes = {
      c4: { midi: c4.midi, emphasis: "small" },
      c5: { midi: c5.midi, emphasis: "small" },
      d4: { midi: d4.midi, emphasis: "large" },
    } satisfies ActiveNotes;

    const result = applyInstrumentNoteEdit({
      activeNotes,
      allTargets: noteTargets,
      scope: "pitch-class",
      target: c4,
    });

    expect(result).toEqual({
      d4: activeNotes.d4,
    });
  });

  it("uses the global emphasis as the current state for active notes without an override", () => {
    const activeNotes = {
      c4: { midi: c4.midi },
    } satisfies ActiveNotes;

    const result = applyInstrumentNoteEdit({
      activeNotes,
      globalEmphasis: "small",
      scope: "one",
      target: c4,
    });

    expect(result).toEqual({});
  });

  it("documents the one-note edit cycle without touching matching pitch classes", () => {
    const firstClick = applyInstrumentNoteEdit({
      activeNotes: undefined,
      globalEmphasis: "large",
      scope: "one",
      target: c4,
    });
    const secondClick = applyInstrumentNoteEdit({
      activeNotes: firstClick,
      globalEmphasis: "large",
      scope: "one",
      target: c4,
    });
    const thirdClick = applyInstrumentNoteEdit({
      activeNotes: {
        ...secondClick,
        c5: { midi: c5.midi, emphasis: "large" },
      },
      globalEmphasis: "large",
      scope: "one",
      target: c4,
    });

    expect(firstClick).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
    });
    expect(secondClick).toEqual({
      c4: { midi: c4.midi, emphasis: "small" },
    });
    expect(thirdClick).toEqual({
      c5: { midi: c5.midi, emphasis: "large" },
    });
  });

  it("documents the edit-all cycle across only the matching visible targets", () => {
    const firstClick = applyInstrumentNoteEdit({
      activeNotes: {},
      allTargets: noteTargets,
      scope: "pitch-class",
      target: c4,
    });
    const secondClick = applyInstrumentNoteEdit({
      activeNotes: firstClick,
      allTargets: noteTargets,
      scope: "pitch-class",
      target: c4,
    });
    const thirdClick = applyInstrumentNoteEdit({
      activeNotes: secondClick,
      allTargets: noteTargets,
      scope: "pitch-class",
      target: c4,
    });

    expect(firstClick).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
      c5: { midi: c5.midi, emphasis: "large" },
    });
    expect(secondClick).toEqual({
      c4: { midi: c4.midi, emphasis: "small" },
      c5: { midi: c5.midi, emphasis: "small" },
    });
    expect(thirdClick).toEqual({});
  });

  it("falls back to editing only the target when edit-all has no target list", () => {
    const result = applyInstrumentNoteEdit({
      activeNotes: {
        d4: { midi: d4.midi, emphasis: "small" },
      },
      scope: "pitch-class",
      target: c4,
    });

    expect(result).toEqual({
      c4: { midi: c4.midi, emphasis: "large" },
      d4: { midi: d4.midi, emphasis: "small" },
    });
  });
});
