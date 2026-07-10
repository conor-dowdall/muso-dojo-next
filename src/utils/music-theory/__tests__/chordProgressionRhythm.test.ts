import { describe, expect, it } from "vitest";
import {
  getChordProgressionRhythmProfile,
  getRequiredBarDivisionForDurations,
} from "@/utils/music-theory/chordProgressionRhythm";

describe("chordProgressionRhythm", () => {
  it("infers required bar divisions from simple rational durations", () => {
    expect(getRequiredBarDivisionForDurations([1, 0.5, 0.5])).toBe(2);
    expect(getRequiredBarDivisionForDurations([0.25, 0.75])).toBe(4);
    expect(getRequiredBarDivisionForDurations([1 / 3, 2 / 3])).toBe(3);
    expect(getRequiredBarDivisionForDurations([0.2, 0.8])).toBe(5);
    expect(getRequiredBarDivisionForDurations([1 / 7, 6 / 7])).toBe(7);
  });

  it("does not treat loose decimal approximations as authored fractions", () => {
    expect(getRequiredBarDivisionForDurations([0.33, 0.67])).toBe(1);
  });

  it("detects split-bar progressions from current source data", () => {
    expect(
      getChordProgressionRhythmProfile("oneFourOneFiveSplitReturn"),
    ).toMatchObject({
      hasSplitBars: true,
      preferredRhythmStarterId: "4-4",
      requiredBarDivision: 2,
      totalBars: 8,
    });
  });

  it("defaults current twelve-bar material to swing", () => {
    expect(getChordProgressionRhythmProfile("twelveBarBlues")).toMatchObject({
      hasSplitBars: false,
      preferredRhythmStarterId: "swing",
      requiredBarDivision: 1,
      totalBars: 12,
    });
  });

  it("uses exact Jazz and Blues categories instead of duration heuristics", () => {
    expect(getChordProgressionRhythmProfile("majorTwoFiveOne")).toMatchObject({
      preferredRhythmStarterId: "swing",
    });
    expect(getChordProgressionRhythmProfile("oneOneFiveFive")).toMatchObject({
      preferredRhythmStarterId: "4-4",
    });
  });
});
