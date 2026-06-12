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
      noteCount: 11,
      octaveOffset: 4,
      octaveRowCount: 3,
      type: "drone",
      wood: "maple",
    });

    expect(normalizedModule).toStrictEqual({
      audioPresetId: "warm-pad",
      id: "drone-1",
      noteCount: 11,
      octaveOffset: 4,
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
        noteCount: 0,
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

  it("normalizes persisted exercise looper settings", () => {
    expect(
      normalizePartModuleConfig({
        audioPresetId: "glass-bell",
        end: { octave: 1, stepOffset: 2 },
        id: "looper-1",
        octaveOffset: 2,
        pattern: {
          direction: "descending",
          extensionDegree: 7,
          extensionDirection: "ascending",
          intervalDegree: 4,
          mode: "interval",
          notePlayback: "together",
        },
        start: { octave: 0, stepOffset: 1 },
        subdivision: "sixteenth",
        type: "exercise-looper",
        wood: "maple",
      }),
    ).toStrictEqual({
      audioPresetId: "glass-bell",
      end: { octave: 1, stepOffset: 2 },
      id: "looper-1",
      octaveOffset: 2,
      pattern: {
        direction: "descending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 4,
        mode: "interval",
        notePlayback: "together",
      },
      start: { octave: 0, stepOffset: 1 },
      subdivision: "sixteenth",
      type: "exercise-looper",
      wood: "maple",
    });
  });

  it("drops invalid and default exercise looper settings", () => {
    expect(
      normalizePartModuleConfig({
        audioPresetId: "piano",
        end: { octave: 1, stepOffset: 0 },
        id: "looper-1",
        octaveOffset: 99,
        pattern: {
          direction: "up-down",
          extensionDegree: 3,
          extensionDirection: "up-down",
          intervalDegree: 3,
          mode: "single",
          notePlayback: "separate",
        },
        start: { octave: 0, stepOffset: 0 },
        subdivision: "quarter",
        type: "exercise-looper",
        wood: "rosewood",
      }),
    ).toStrictEqual({
      id: "looper-1",
      type: "exercise-looper",
    });
  });
});
