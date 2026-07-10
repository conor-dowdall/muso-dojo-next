import { describe, expect, it } from "vitest";
import { createPartSequencePlaybackPlan } from "@/audio/partSequencePlanning";
import { RHYTHM_PPQ } from "@/data/rhythmPresets";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";

function createPart(
  id: string,
  modules: MusicPartConfig["modules"] = [],
  settings: Partial<Omit<MusicPartConfig, "id" | "modules">> = {},
): MusicPartConfig {
  return {
    id,
    modules,
    noteCollectionKey: "major",
    rootNote: "C",
    ...settings,
  };
}

function createSession(parts: MusicPartConfig[]): SessionConfig {
  return {
    id: "session",
    lastModified: "2026-06-23T00:00:00.000Z",
    name: "Session",
    parts,
    tempoBpm: 120,
  };
}

describe("createPartSequencePlaybackPlan", () => {
  it("uses first-class Part Length independently of Rhythm loop length", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart(
          "part",
          [
            {
              id: "rhythm",
              rhythm: {
                recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 6 },
                source: "recipe",
              },
              type: "rhythm",
            },
          ],
          { lengthBeats: 2 },
        ),
      ]),
    );

    expect(plan.parts[0]?.durationBeats).toBe(2);
    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.cycleTicks).toBe(
      RHYTHM_PPQ * 6,
    );
  });

  it("honors authored fractional duration for an unnormalized legacy Part", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([createPart("third-bar", [], { durationInBars: 1 / 3 })]),
    );

    expect(plan.parts[0]?.durationBeats).toBeCloseTo(4 / 3);
  });

  it("adds stable automatic Looper and Rhythm fallbacks for an empty Part", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([createPart("part", [], { lengthBeats: 1 })]),
    );

    expect(plan.parts[0]).toMatchObject({
      durationBeats: 1,
      exerciseRequests: [
        {
          countInBeats: 0,
          id: "part-sequence-looper:part",
          metronomeEnabled: false,
          presetId: "plucked-string",
        },
      ],
      rhythmRequests: [{ id: "part-sequence-drums:part" }],
    });
    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.cycleTicks).toBe(
      RHYTHM_PPQ,
    );
  });

  it("uses Swing for an automatic Jazz or Blues Part", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("swing-part", [], {
          automaticRhythm: "swing",
          lengthBeats: 4,
        }),
      ]),
    );

    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.hits).toContainEqual({
      atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
      sampleId: "ride",
      velocity: 0.108,
    });
  });

  it("plays every explicit Looper and Rhythm and suppresses same-type fallbacks", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [
          { id: "exercise-a", type: "exercise-looper" },
          { id: "rhythm-a", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
          { id: "exercise-b", type: "exercise-looper" },
          { id: "rhythm-b", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
          { id: "drone", type: "drone" },
        ]),
      ]),
    );

    expect(
      plan.parts[0]?.exerciseRequests.map((request) => request.id),
    ).toEqual(["exercise-a", "exercise-b"]);
    expect(plan.parts[0]?.rhythmRequests.map((request) => request.id)).toEqual([
      "rhythm-a",
      "rhythm-b",
    ]);
  });

  it("supplies only the missing automatic lane", () => {
    const rhythmOnly = createPart("rhythm-only", [
      { id: "rhythm", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
    ]);
    const looperOnly = createPart("looper-only", [
      { id: "exercise", type: "exercise-looper" },
    ]);
    const plan = createPartSequencePlaybackPlan(
      createSession([rhythmOnly, looperOnly]),
    );

    expect(plan.parts[0]?.exerciseRequests[0]?.id).toBe(
      "part-sequence-looper:rhythm-only",
    );
    expect(plan.parts[0]?.rhythmRequests[0]?.id).toBe("rhythm");
    expect(plan.parts[1]?.exerciseRequests[0]?.id).toBe("exercise");
    expect(plan.parts[1]?.rhythmRequests[0]?.id).toBe(
      "part-sequence-drums:looper-only",
    );
  });

  it("deduplicates the metronome across layered Loopers", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [
          { id: "exercise-a", metronomeEnabled: true, type: "exercise-looper" },
          { id: "exercise-b", metronomeEnabled: true, type: "exercise-looper" },
        ]),
      ]),
    );

    expect(
      plan.parts[0]?.exerciseRequests.map(
        (request) => request.metronomeEnabled,
      ),
    ).toEqual([true, false]);
  });

  it("keeps content signatures stable for tempo-only and live Rhythm edits", () => {
    const part = createPart("part", [
      { id: "rhythm", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
    ]);
    const base = createPartSequencePlaybackPlan(createSession([part]));
    const faster = createPartSequencePlaybackPlan({
      ...createSession([part]),
      tempoBpm: 140,
    });
    const edited = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [
          {
            id: "rhythm",
            rhythm: {
              recipe: {
                ...DEFAULT_RHYTHM_SELECTION.recipe,
                timekeeper: {
                  ...DEFAULT_RHYTHM_SELECTION.recipe.timekeeper,
                  sound: "ride",
                },
              },
              source: "recipe",
            },
            type: "rhythm",
          },
        ]),
      ]),
    );

    expect(base.contentSignature).toBe(faster.contentSignature);
    expect(base.signature).not.toBe(faster.signature);
    expect(base.contentSignature).toBe(edited.contentSignature);
    expect(base.updateSignature).not.toBe(edited.updateSignature);
  });
});
