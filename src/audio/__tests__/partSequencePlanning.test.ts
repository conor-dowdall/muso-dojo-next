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
  it("uses Automatic Rhythm beats when no module owns the band role", () => {
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
          {
            automaticRhythm: { beats: 2, style: "standard" },
            band: {
              backingNotes: { mode: "automatic" },
              rhythm: { mode: "automatic" },
            },
          },
        ),
      ]),
    );

    expect(plan.parts[0]?.durationBeats).toBe(2);
    expect(plan.parts[0]?.rhythmRequests[0]).toMatchObject({
      id: "part-sequence-drums:part",
      pattern: { cycleTicks: RHYTHM_PPQ * 2 },
    });
  });

  it("uses the selected band Rhythm beat length", () => {
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
          {
            band: {
              backingNotes: { mode: "automatic" },
              rhythm: { mode: "module", moduleId: "rhythm" },
            },
            automaticRhythm: { beats: 2, style: "standard" },
          },
        ),
      ]),
    );

    expect(plan.parts[0]?.durationBeats).toBe(6);
  });

  it("honors authored fractional duration for an unnormalized legacy Part", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([createPart("third-bar", [], { durationInBars: 1 / 3 })]),
    );

    expect(plan.parts[0]?.durationBeats).toBeCloseTo(4 / 3);
  });

  it("adds stable automatic Looper and Rhythm fallbacks for an empty Part", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [], {
          automaticRhythm: { beats: 1, style: "standard" },
        }),
      ]),
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
          automaticRhythm: { beats: 4, style: "swing" },
        }),
      ]),
    );

    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.hits).toContainEqual({
      atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
      sampleId: "ride",
      velocity: 0.108,
    });
  });

  it("plays only the explicitly selected Looper and Rhythm", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart(
          "part",
          [
            { id: "exercise-a", type: "exercise-looper" },
            {
              id: "rhythm-a",
              rhythm: DEFAULT_RHYTHM_SELECTION,
              type: "rhythm",
            },
            { id: "exercise-b", type: "exercise-looper" },
            {
              id: "rhythm-b",
              rhythm: DEFAULT_RHYTHM_SELECTION,
              type: "rhythm",
            },
            { id: "drone", type: "drone" },
          ],
          {
            band: {
              backingNotes: { mode: "module", moduleId: "exercise-b" },
              rhythm: { mode: "module", moduleId: "rhythm-b" },
            },
          },
        ),
      ]),
    );

    expect(
      plan.parts[0]?.exerciseRequests.map((request) => request.id),
    ).toEqual(["exercise-b"]);
    expect(plan.parts[0]?.rhythmRequests.map((request) => request.id)).toEqual([
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

  it("uses the metronome setting from only the selected Looper", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart(
          "part",
          [
            {
              id: "exercise-a",
              metronomeEnabled: true,
              type: "exercise-looper",
            },
            {
              id: "exercise-b",
              metronomeEnabled: true,
              type: "exercise-looper",
            },
          ],
          {
            band: {
              backingNotes: { mode: "module", moduleId: "exercise-b" },
              rhythm: { mode: "automatic" },
            },
          },
        ),
      ]),
    );

    expect(
      plan.parts[0]?.exerciseRequests.map(
        (request) => request.metronomeEnabled,
      ),
    ).toEqual([true]);
  });

  it("supports intentionally muting either automatic band role", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("silent", [], {
          band: {
            backingNotes: { mode: "off" },
            rhythm: { mode: "off" },
          },
        }),
      ]),
    );

    expect(plan.parts[0]?.exerciseRequests).toEqual([]);
    expect(plan.parts[0]?.rhythmRequests).toEqual([]);
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
