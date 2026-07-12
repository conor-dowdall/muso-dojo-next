import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
  getBandChoosesRhythmSummary,
} from "../backingBandSummaries";

function createPart(id: string, style: "standard" | "swing"): MusicPartConfig {
  return {
    automaticRhythm: { style },
    band: {
      backingNotes: { mode: "session" },
      rhythm: { mode: "session" },
    },
    id,
    modules: [],
    noteCollectionKey: "major",
    rootNote: "C",
  };
}

describe("backing band summaries", () => {
  it("uses the same compact value list for Backing Notes", () => {
    expect(
      getBackingNotesSummary({ audioPresetId: "piano", octaveOffset: 0 }),
    ).toBe("Piano • Octave 3");
  });

  it("uses the complete musical value list for a concrete Rhythm", () => {
    expect(getBackingRhythmSummary(DEFAULT_RHYTHM_SELECTION)).toBe(
      "4/4 • Kit • Hi-Hat • 2 per Beat",
    );
  });

  it("summarizes Band Chooses without claiming a fixed meter", () => {
    expect(
      getBandChoosesRhythmSummary([
        createPart("straight", "standard"),
        createPart("swing", "swing"),
      ]),
    ).toBe("Kit • Hi-Hat or Ride • 2 per Beat or Swing Eighths");
  });

  it("only summarizes Parts routed to the Session Band", () => {
    const localRhythmPart = createPart("local", "swing");
    localRhythmPart.modules = [
      { id: "rhythm", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
    ];
    localRhythmPart.band = {
      backingNotes: { mode: "session" },
      rhythm: { mode: "module", moduleId: "rhythm" },
    };

    expect(
      getBandChoosesRhythmSummary([
        createPart("session", "standard"),
        localRhythmPart,
      ]),
    ).toBe("Kit • Hi-Hat • 2 per Beat");
  });
});
