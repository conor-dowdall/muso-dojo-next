import { describe, expect, it } from "vitest";
import {
  getPartDurationBeats,
  getRepresentablePartDurationBeats,
} from "@/utils/music-part/partDuration";

describe("partDuration", () => {
  it("keeps simple authored fractions as default playback beat durations", () => {
    expect(getPartDurationBeats(1 / 3)).toBeCloseTo(4 / 3);
    expect(getPartDurationBeats(0.2)).toBeCloseTo(0.8);
  });

  it("keeps Rhythm beat-count representation limited to integer cycles", () => {
    expect(getRepresentablePartDurationBeats(1 / 3)).toBeUndefined();
    expect(getRepresentablePartDurationBeats(0.5)).toBe(2);
  });
});
