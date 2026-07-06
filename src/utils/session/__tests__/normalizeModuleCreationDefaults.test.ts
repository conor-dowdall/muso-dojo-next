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
