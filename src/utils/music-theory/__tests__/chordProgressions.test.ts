import { chordProgressions } from "@musodojo/music-theory-data";
import { describe, expect, it } from "vitest";
import {
  getChordProgressionDisplayLabels,
  getChordProgressionDisplaySummary,
} from "@/utils/music-theory/chordProgressions";

describe("chord progression display", () => {
  it("uses practical chord names without losing theoretical Roman analysis", () => {
    const summary = getChordProgressionDisplaySummary(
      "C♯",
      chordProgressions.jazzBlues,
    );

    expect(summary.chordNames).toContain("G°7");
    expect(summary.chordNames.join(" ")).not.toContain("F𝄪");
    expect(summary.romanNames.join(" ")).toContain("♯iv°7");
  });

  it("uses catalog-definition names for built-in picker titles", () => {
    expect(getChordProgressionDisplayLabels("C", "jazzBlues").titleLabel).toBe(
      "Jazz Blues",
    );
  });
});
