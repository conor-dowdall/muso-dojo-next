import { describe, expect, it } from "vitest";
import { normalizePartModuleConfig } from "@/utils/session/normalizePartModuleConfig";

describe("normalizePartModuleConfig", () => {
  it("normalizes drone module settings", () => {
    const normalizedModule = normalizePartModuleConfig({
      id: "drone-1",
      type: "drone",
      octave: 8,
      audioPresetId: "warm-pad",
    });

    expect(normalizedModule).toStrictEqual({
      id: "drone-1",
      type: "drone",
      octave: 5,
      audioPresetId: "warm-pad",
    });
  });

  it("omits default drone settings", () => {
    const normalizedModule = normalizePartModuleConfig({
      id: "drone-1",
      type: "drone",
      octave: 3,
      audioPresetId: "soft-organ",
    });

    expect(normalizedModule).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });
  });
});
