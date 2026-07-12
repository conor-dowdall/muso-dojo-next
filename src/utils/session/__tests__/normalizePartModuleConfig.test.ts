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
      audioPresetId: "bowed-strings",
      id: "drone-1",
      noteCount: 11,
      octaveOffset: 4,
      type: "drone",
      wood: "maple",
    });

    expect(normalizedModule).toStrictEqual({
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
        type: "drone",
        wood: "rosewood",
      }),
    ).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });

    expect(
      normalizePartModuleConfig({
        audioPresetId: "acoustic-bass",
        id: "drone-1",
        noteCount: 0,
        octaveOffset: 5,
        type: "drone",
        wood: "not-a-wood",
      }),
    ).toStrictEqual({
      id: "drone-1",
      type: "drone",
    });

    expect(
      normalizePartModuleConfig({
        audioPresetId: "not-a-preset",
        id: "drone-1",
        type: "drone",
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
        audioPresetId: "bowed-strings",
        countInBeats: 3,
        end: { octave: 1, stepOffset: 2 },
        id: "looper-1",
        metronomeEnabled: true,
        octaveOffset: 2,
        pattern: {
          direction: "descending",
          extensionDegree: 7,
          extensionDirection: "ascending",
          intervalDegree: 4,
          intervalDirection: "descending",
          mode: "interval",
          notePlayback: "together",
        },
        start: { octave: 0, stepOffset: 1 },
        subdivision: "sixteenth",
        type: "exercise-looper",
        wood: "maple",
      }),
    ).toStrictEqual({
      audioPresetId: "bowed-strings",
      countInBeats: 3,
      end: { octave: 1, stepOffset: 2 },
      id: "looper-1",
      metronomeEnabled: true,
      octaveOffset: 2,
      pattern: {
        direction: "descending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 4,
        intervalDirection: "descending",
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
        audioPresetId: "plucked-string",
        countInBeats: 0,
        end: { octave: 1, stepOffset: 0 },
        id: "looper-1",
        metronomeEnabled: false,
        octaveOffset: -1,
        pattern: {
          direction: "up-down",
          extensionDegree: 5,
          extensionDirection: "up-down",
          intervalDegree: 3,
          intervalDirection: "up-down",
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

    expect(
      normalizePartModuleConfig({
        countInBeats: 5,
        id: "looper-1",
        metronomeEnabled: "yes",
        octaveOffset: -3,
        type: "exercise-looper",
      }),
    ).toStrictEqual({
      id: "looper-1",
      type: "exercise-looper",
    });

    expect(
      normalizePartModuleConfig({
        id: "looper-1",
        octaveOffset: 5,
        type: "exercise-looper",
      }),
    ).toStrictEqual({
      id: "looper-1",
      type: "exercise-looper",
    });
  });

  it("keeps exercise looper octave offsets at the practical boundaries", () => {
    expect(
      normalizePartModuleConfig({
        id: "looper-1",
        octaveOffset: -2,
        type: "exercise-looper",
      }),
    ).toMatchObject({ octaveOffset: -2 });

    expect(
      normalizePartModuleConfig({
        id: "looper-1",
        octaveOffset: 4,
        type: "exercise-looper",
      }),
    ).toMatchObject({ octaveOffset: 4 });
  });

  it("drops unsupported exercise pattern extension degrees", () => {
    expect(
      normalizePartModuleConfig({
        id: "looper-1",
        pattern: {
          direction: "descending",
          extensionDegree: 3,
          extensionDirection: "ascending",
          intervalDegree: 4,
          intervalDirection: "descending",
          mode: "interval",
          notePlayback: "together",
        },
        type: "exercise-looper",
      }),
    ).toStrictEqual({
      id: "looper-1",
      type: "exercise-looper",
    });
  });

  it("normalizes rhythm modules without persisted volume", () => {
    expect(
      normalizePartModuleConfig({
        id: "rhythm-1",
        rhythm: {
          recipe: {
            beats: 7,
            groove: "bluegrass",
            grouping: "3+4",
            timekeeper: {
              feel: "swing",
              sound: "ride",
              subdivision: "eighth",
            },
          },
          source: "recipe",
        },
        type: "rhythm",
        volume: 0.4,
      }),
    ).toStrictEqual({
      id: "rhythm-1",
      rhythm: {
        recipe: {
          beats: 7,
          groove: "bluegrass",
          grouping: "3+4",
          timekeeper: {
            feel: "straight",
            sound: "ride",
            subdivision: "eighth",
          },
        },
        source: "recipe",
      },
      type: "rhythm",
    });
  });

  it("falls back to the default rhythm selection for invalid rhythm modules", () => {
    expect(
      normalizePartModuleConfig({
        id: "rhythm-1",
        rhythm: {
          source: "unknown",
        },
        type: "rhythm",
      }),
    ).toStrictEqual({
      id: "rhythm-1",
      rhythm: {
        recipe: {
          beats: 4,
          groove: "kit",
          grouping: "auto",
          timekeeper: {
            feel: "straight",
            sound: "hat",
            subdivision: "eighth",
          },
        },
        source: "recipe",
      },
      type: "rhythm",
    });
  });

  it("normalizes rhythm appearance", () => {
    expect(
      normalizePartModuleConfig({
        id: "rhythm-1",
        rhythm: {
          source: "recipe",
        },
        type: "rhythm",
        wood: "ebony",
      }),
    ).toMatchObject({
      id: "rhythm-1",
      type: "rhythm",
      wood: "ebony",
    });

    expect(
      normalizePartModuleConfig({
        id: "rhythm-1",
        rhythm: {
          source: "recipe",
        },
        type: "rhythm",
        wood: "rosewood",
      }),
    ).not.toHaveProperty("wood");
  });
});
