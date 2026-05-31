import { describe, expect, it } from "vitest";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import { createFretboardGeometry } from "@/utils/fretboard/createFretboardGeometry";
import {
  createFretboardSizing,
  getMinimumPlayableStringRowHeight,
} from "@/utils/fretboard/createFretboardSizing";

describe("fretboard intrinsic sizing", () => {
  it("uses playable row-height floors for touch targets", () => {
    expect(getMinimumPlayableStringRowHeight(4)).toBe(30);
    expect(getMinimumPlayableStringRowHeight(5)).toBe(27);
    expect(getMinimumPlayableStringRowHeight(6)).toBe(24);
  });

  it("keeps small four-string instruments comfortably playable by default", () => {
    const violin = createFretboardGeometry(
      createFretboardConfig(undefined, { instrument: "violin" }),
    ).sizing;
    const mandolin = createFretboardGeometry(
      createFretboardConfig(undefined, { instrument: "mandolin" }),
    ).sizing;

    expect(violin).toMatchObject({
      preferredHeight: 131,
      minHeight: 131,
    });
    expect(mandolin).toMatchObject({
      preferredHeight: 132,
      minHeight: 132,
    });
  });

  it("preserves the natural height of instruments that are already roomy", () => {
    const guitar = createFretboardGeometry(
      createFretboardConfig(undefined, { instrument: "guitar" }),
    ).sizing;
    const doubleBass = createFretboardGeometry(
      createFretboardConfig(undefined, { instrument: "doubleBass" }),
    ).sizing;

    expect(guitar).toMatchObject({
      preferredHeight: 156,
      minHeight: 156,
    });
    expect(doubleBass).toMatchObject({
      preferredHeight: 148,
      minHeight: 132,
    });
  });

  it("derives width from fret count and height from string count independently", () => {
    const compact = createFretboardSizing({
      instrument: "guitar",
      numFrets: 6,
      stringCount: 6,
      showFretLabels: true,
    });
    const regular = createFretboardSizing({
      instrument: "guitar",
      numFrets: 13,
      stringCount: 6,
      showFretLabels: true,
    });

    expect(compact.preferredHeight).toBe(regular.preferredHeight);
    expect(compact.minHeight).toBe(regular.minHeight);
    expect(compact.preferredWidth).toBeLessThan(regular.preferredWidth);
  });
});
