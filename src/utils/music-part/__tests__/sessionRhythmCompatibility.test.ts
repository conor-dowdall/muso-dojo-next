import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import {
  getSessionRhythmBarConstraint,
  sessionRhythmBeatsPreserveAuthoredBars,
} from "../sessionRhythmCompatibility";

function createPart(
  id: string,
  patch: Partial<Omit<MusicPartConfig, "id">> = {},
): MusicPartConfig {
  return {
    id,
    modules: [],
    noteCollectionKey: "major",
    rootNote: "C",
    ...patch,
  };
}

describe("Session Rhythm bar compatibility", () => {
  it("combines the divisions of split Parts following the Session Rhythm", () => {
    const parts = [
      createPart("half", { durationInBars: 0.5 }),
      createPart("third", { durationInBars: 1 / 3 }),
    ];

    expect(getSessionRhythmBarConstraint(parts)).toEqual({
      hasSplitBars: true,
      requiredBarDivision: 6,
    });
    expect(sessionRhythmBeatsPreserveAuthoredBars(parts, 6)).toBe(true);
    expect(sessionRhythmBeatsPreserveAuthoredBars(parts, 4)).toBe(false);
  });

  it("does not let a locally routed Rhythm constrain the Session setting", () => {
    const parts = [
      createPart("session-half", { durationInBars: 0.5 }),
      createPart("local-third", {
        band: {
          backingNotes: { mode: "session" },
          rhythm: { mode: "module", moduleId: "rhythm" },
        },
        durationInBars: 1 / 3,
        modules: [
          {
            id: "rhythm",
            rhythm: {
              recipe: {
                beats: 1,
                groove: "pulse",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "2-per-beat",
                },
              },
              source: "recipe",
            },
            type: "rhythm",
          },
        ],
      }),
    ];

    expect(getSessionRhythmBarConstraint(parts)).toEqual({
      hasSplitBars: true,
      requiredBarDivision: 2,
    });
  });
});
