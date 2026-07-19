import { describe, expect, it } from "vitest";
import {
  normalizeModuleCreationDefaults,
  normalizeRhythmModuleCreationDefault,
} from "@/utils/session/normalizeModuleCreationDefaults";

describe("normalizeModuleCreationDefaults", () => {
  it("keeps custom module kind selections by dialog context", () => {
    expect(
      normalizeModuleCreationDefaults({
        moduleKindDefaults: {
          session: ["keyboard", "keyboard"],
          part: ["rhythm"],
        },
      }),
    ).toStrictEqual({
      moduleKindDefaults: {
        session: ["keyboard"],
        part: ["rhythm"],
      },
    });
  });

  it("drops built-in module kind selections by dialog context", () => {
    expect(
      normalizeModuleCreationDefaults({
        moduleKindDefaults: {
          session: ["fretboard"],
          part: [],
        },
      }),
    ).toBeUndefined();
  });

  it("drops built-in Rhythm creation defaults", () => {
    expect(
      normalizeRhythmModuleCreationDefault({
        rhythm: {
          recipe: {
            beats: 4,
            groove: "kit",
            grouping: "auto",
            timekeeper: {
              feel: "straight",
              sound: "hat",
              subdivision: "2-per-beat",
            },
          },
          source: "recipe",
        },
        wood: "rosewood",
      }),
    ).toBeUndefined();
  });

  it("keeps a custom Fretboard tuning snapshot in creation defaults", () => {
    expect(
      normalizeModuleCreationDefaults({
        fretboard: {
          instrument: "ukulele",
          tuning: [69, 64, 60, 67],
          tuningName: "Low G",
          handedness: "right",
          appearanceSource: "auto",
          theme: "rosewood",
          inlayPreset: "dots",
        },
      }),
    ).toMatchObject({
      fretboard: {
        instrument: "ukulele",
        tuning: [69, 64, 60, 67],
        tuningName: "Low G",
      },
    });
  });

  it("keeps custom Rhythm recipe defaults without persisting default wood", () => {
    expect(
      normalizeRhythmModuleCreationDefault({
        rhythm: {
          recipe: {
            beats: 4,
            groove: "kit",
            grouping: "auto",
            timekeeper: {
              feel: "swing",
              sound: "ride",
              subdivision: "2-per-beat",
            },
          },
          source: "recipe",
        },
        wood: "rosewood",
      }),
    ).toStrictEqual({
      rhythm: {
        recipe: {
          beats: 4,
          groove: "kit",
          grouping: "auto",
          timekeeper: {
            feel: "swing",
            sound: "ride",
            subdivision: "2-per-beat",
          },
        },
        source: "recipe",
      },
    });
  });
});
