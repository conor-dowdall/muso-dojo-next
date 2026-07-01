import { describe, expect, it } from "vitest";
import { normalizeRhythmModuleCreationDefault } from "@/utils/session/normalizeModuleCreationDefaults";

describe("normalizeModuleCreationDefaults", () => {
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
              subdivision: "eighth",
            },
          },
          source: "recipe",
        },
        wood: "rosewood",
      }),
    ).toBeUndefined();
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
              subdivision: "eighth",
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
            subdivision: "eighth",
          },
        },
        source: "recipe",
      },
    });
  });
});
