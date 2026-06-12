import { describe, expect, it } from "vitest";
import { shiftIntervalLabelByOctaves } from "@/utils/music-theory/intervalLabel";

describe("shiftIntervalLabelByOctaves", () => {
  it("creates compound intervals while preserving accidentals", () => {
    expect(shiftIntervalLabelByOctaves("1", 1)).toBe("8");
    expect(shiftIntervalLabelByOctaves("3", 1)).toBe("10");
    expect(shiftIntervalLabelByOctaves("♭2", 1)).toBe("♭9");
    expect(shiftIntervalLabelByOctaves("♯4", 2)).toBe("♯18");
  });
});
