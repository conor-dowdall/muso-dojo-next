import { describe, expect, it } from "vitest";
import { normalizePartModuleConfig } from "@/utils/session/normalizePartModuleConfig";

describe("normalizePartModuleConfig", () => {
  it("normalizes a drone module", () => {
    const normalizedModule = normalizePartModuleConfig({
      id: "drone-1",
      type: "drone",
    });

    expect(normalizedModule).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });
  });

  it("keeps valid persisted drone settings", () => {
    const normalizedModule = normalizePartModuleConfig({
      audioPresetId: "warm-pad",
      id: "drone-1",
      octaveOffset: 4,
      octaveRowCount: 3,
      type: "drone",
      wood: "maple",
    });

    expect(normalizedModule).toStrictEqual({
      audioPresetId: "warm-pad",
      id: "drone-1",
      octaveOffset: 4,
      octaveRowCount: 3,
      type: "drone",
      wood: "maple",
    });
  });

  it("drops invalid and default drone settings", () => {
    expect(
      normalizePartModuleConfig({
        audioPresetId: "reference-tone",
        id: "drone-1",
        octaveOffset: 0,
        octaveRowCount: 1,
        type: "drone",
        wood: "rosewood",
      }),
    ).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });

    expect(
      normalizePartModuleConfig({
        audioPresetId: "not-a-preset",
        id: "drone-1",
        octaveOffset: 5,
        octaveRowCount: 12,
        type: "drone",
        wood: "not-a-wood",
      }),
    ).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });

    expect(
      normalizePartModuleConfig({
        id: "drone-1",
        octaveOffset: -3,
        type: "drone",
      }),
    ).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });
  });
});
