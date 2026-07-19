import { describe, expect, it } from "vitest";
import { createPartSequencePlaybackPlan } from "@/audio/partSequencePlanning";
import { RHYTHM_PPQ } from "@/data/rhythmPresets";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";

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
            automaticRhythm: { style: "standard" },
            band: {
              backingNotes: { mode: "session" },
              rhythm: { mode: "session" },
            },
            durationInBars: 0.5,
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

  it("plans one parent-bar Rhythm across automatic fractional Parts", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("bar-a", [], {
          automaticRhythm: { style: "swing" },
          durationInBars: 0.5,
        }),
        createPart("bar-b", [], {
          automaticRhythm: { style: "swing" },
          durationInBars: 0.5,
        }),
      ]),
    );

    expect(plan.parts).toMatchObject([
      {
        continueRhythm: true,
        durationBeats: 2,
        rhythmRequests: [
          {
            id: "part-sequence-drums:bar:bar-a",
            pattern: {
              cycleTicks: RHYTHM_PPQ * 4,
              meter: { beatUnit: 4, beats: 4 },
            },
          },
        ],
      },
      {
        continueRhythm: true,
        durationBeats: 2,
        rhythmRequests: [
          {
            id: "part-sequence-drums:bar:bar-a",
            pattern: {
              cycleTicks: RHYTHM_PPQ * 4,
              meter: { beatUnit: 4, beats: 4 },
            },
          },
        ],
      },
    ]);
  });

  it("keeps a compatible Session Rhythm alive across authored bar boundaries", () => {
    const createHalfBar = (id: string) =>
      createPart(id, [], {
        automaticRhythm: { style: "swing" },
        durationInBars: 0.5,
      });
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createHalfBar("one-a"),
        createHalfBar("one-b"),
        createHalfBar("two-a"),
        createHalfBar("two-b"),
      ]),
    );

    expect(
      plan.parts.map((part) => ({
        continueRhythm: part.continueRhythm,
        rhythmId: part.rhythmRequests[0]?.id,
      })),
    ).toEqual([
      {
        continueRhythm: true,
        rhythmId: "part-sequence-drums:bar:one-a",
      },
      {
        continueRhythm: true,
        rhythmId: "part-sequence-drums:bar:one-a",
      },
      {
        continueRhythm: true,
        rhythmId: "part-sequence-drums:bar:one-a",
      },
      {
        continueRhythm: true,
        rhythmId: "part-sequence-drums:bar:one-a",
      },
    ]);
  });

  it("starts a new rhythm run when the authored bar rhythm changes", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("swing", [], {
          automaticRhythm: { style: "swing" },
        }),
        createPart("straight", [], {
          automaticRhythm: { style: "standard" },
        }),
      ]),
    );

    expect(plan.parts).toMatchObject([
      {
        continueRhythm: false,
        rhythmRequests: [{ id: "part-sequence-drums:swing" }],
      },
      {
        continueRhythm: false,
        rhythmRequests: [{ id: "part-sequence-drums:straight" }],
      },
    ]);
  });

  it("keeps independent local Rhythm modules separate when their audio does not compose", () => {
    const createHalfBar = (id: string) =>
      createPart(
        id,
        [
          {
            id: `rhythm-${id}`,
            rhythm: {
              recipe: {
                beats: 1,
                groove: "pulse",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "3-per-beat",
                },
              },
              source: "recipe",
            },
            type: "rhythm",
          },
        ],
        {
          band: {
            backingNotes: { mode: "session" },
            rhythm: { mode: "module", moduleId: `rhythm-${id}` },
          },
          durationInBars: 0.5,
        },
      );
    const plan = createPartSequencePlaybackPlan(
      createSession([createHalfBar("split-a"), createHalfBar("split-b")]),
    );

    expect(plan.parts).toMatchObject([
      {
        continueRhythm: false,
        rhythmRequests: [
          {
            id: "rhythm-split-a",
            pattern: {
              cycleTicks: RHYTHM_PPQ,
              meter: { beatUnit: 4, beats: 1 },
            },
          },
        ],
      },
      {
        continueRhythm: false,
        rhythmRequests: [{ id: "rhythm-split-b" }],
      },
    ]);
  });

  it("keeps a 6/8 Split Return rhythm continuous through its two half-bar chords", () => {
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      moduleRequests: [
        {
          settings: {
            rhythm: {
              recipe: {
                beats: 2,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "3-per-beat",
                },
              },
              source: "recipe",
            },
          },
          type: "rhythm",
        },
      ],
      progressionKey: "oneFourOneFiveSplitReturn",
      rootNote: "C",
    });
    const plan = createPartSequencePlaybackPlan(createSession(parts));
    const firstHalf = plan.parts[6];
    const secondHalf = plan.parts[7];

    expect(firstHalf).toMatchObject({
      continueRhythm: false,
      durationBeats: 1,
      rhythmRequests: [
        {
          pattern: {
            cycleTicks: RHYTHM_PPQ * 2,
            meter: { beatUnit: 4, beats: 2 },
          },
        },
      ],
    });
    expect(firstHalf?.rhythmRequests[0]?.id).toMatch(
      /^part-sequence-drums:bar:/,
    );
    expect(firstHalf?.rhythmRequests[0]?.pattern.hits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atTicks: RHYTHM_PPQ,
          sampleId: "snare",
        }),
      ]),
    );
    expect(secondHalf).toMatchObject({
      continueRhythm: true,
      durationBeats: 1,
    });
    expect(secondHalf?.rhythmRequests[0]?.id).toBe(
      firstHalf?.rhythmRequests[0]?.id,
    );
  });

  it("uses one compatible Custom Session Rhythm across fractional Parts", () => {
    const session = createSession([
      createPart("split-a", [], { durationInBars: 0.5 }),
      createPart("split-b", [], { durationInBars: 0.5 }),
    ]);
    session.backingBand = {
      countInBeats: 0,
      looper: {
        audioPresetId: "acoustic-bass",
        enabled: true,
        octaveOffset: 0,
      },
      rhythm: {
        mode: "custom",
        selection: {
          recipe: {
            beats: 2,
            groove: "kit",
            grouping: "auto",
            timekeeper: {
              feel: "straight",
              sound: "hat",
              subdivision: "3-per-beat",
            },
          },
          source: "recipe",
        },
      },
    };

    const plan = createPartSequencePlaybackPlan(session);

    expect(plan.parts).toMatchObject([
      {
        continueRhythm: true,
        durationBeats: 1,
        rhythmRequests: [
          {
            pattern: { cycleTicks: RHYTHM_PPQ * 2 },
          },
        ],
      },
      {
        continueRhythm: true,
        durationBeats: 1,
      },
    ]);
    expect(plan.parts[1]?.rhythmRequests[0]).toBe(
      plan.parts[0]?.rhythmRequests[0],
    );
    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.hits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atTicks: RHYTHM_PPQ,
          sampleId: "snare",
        }),
      ]),
    );
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
              backingNotes: { mode: "session" },
              rhythm: { mode: "module", moduleId: "rhythm" },
            },
            automaticRhythm: { style: "standard" },
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
          automaticRhythm: { style: "standard" },
          durationInBars: 0.25,
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
          presetId: "acoustic-bass",
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
          automaticRhythm: { style: "swing" },
        }),
      ]),
    );

    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.hits).toContainEqual({
      atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
      sampleId: "ride",
      velocity: 0.108,
    });
  });

  it("applies Session Notes and Rhythm defaults to inherited lanes", () => {
    const session = createSession([
      createPart("part", [], {
        automaticRhythm: { style: "standard" },
      }),
    ]);
    session.backingBand = {
      countInBeats: 4,
      looper: {
        audioPresetId: "piano",
        enabled: true,
        octaveOffset: 1,
      },
      rhythm: {
        mode: "custom",
        selection: {
          recipe: {
            ...DEFAULT_RHYTHM_SELECTION.recipe,
            timekeeper: {
              feel: "swing",
              sound: "ride",
              subdivision: "2-per-beat",
            },
          },
          source: "recipe",
        },
      },
    };
    const plan = createPartSequencePlaybackPlan(session);

    expect(plan.countIn).toEqual({ durationBeats: 4, pulses: 4 });
    expect(plan.parts[0]?.exerciseRequests[0]?.presetId).toBe("piano");
    expect(plan.parts[0]?.exerciseRequests[0]?.events[0]?.midi).toBe(60);
    expect(plan.parts[0]?.rhythmRequests[0]?.pattern.hits).toContainEqual({
      atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
      sampleId: "ride",
      velocity: 0.108,
    });
  });

  it("mutes inherited lanes without muting a local module override", () => {
    const localRhythm = {
      id: "rhythm",
      rhythm: DEFAULT_RHYTHM_SELECTION,
      type: "rhythm" as const,
    };
    const session = createSession([
      createPart("inherited"),
      createPart("local", [localRhythm], {
        band: {
          backingNotes: { mode: "session" },
          rhythm: { mode: "module", moduleId: "rhythm" },
        },
      }),
    ]);
    session.backingBand = {
      countInBeats: 0,
      looper: {
        audioPresetId: "plucked-string",
        enabled: false,
        octaveOffset: 0,
      },
      rhythm: { mode: "off", selection: DEFAULT_RHYTHM_SELECTION },
    };
    const plan = createPartSequencePlaybackPlan(session);

    expect(plan.countIn).toEqual({ durationBeats: 0, pulses: 0 });
    expect(plan.parts[0]?.exerciseRequests).toEqual([]);
    expect(plan.parts[0]?.rhythmRequests).toEqual([]);
    expect(plan.parts[1]?.exerciseRequests).toEqual([]);
    expect(plan.parts[1]?.rhythmRequests[0]?.id).toBe("rhythm");
  });

  it("creates a one-Part loop plan while preserving its Session index", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([createPart("first"), createPart("second")]),
      { mode: "part-loop", partId: "second" },
    );

    expect(plan.mode).toBe("part-loop");
    expect(plan.parts).toHaveLength(1);
    expect(plan.parts[0]).toMatchObject({ index: 1, partId: "second" });
  });

  it("uses a custom Session Rhythm recipe and length for inherited Parts", () => {
    const session = createSession([
      createPart("five-four", [], {
        automaticRhythm: { style: "swing" },
      }),
    ]);
    session.backingBand = {
      countInBeats: 3,
      looper: {
        audioPresetId: "plucked-string",
        enabled: true,
        octaveOffset: -1,
      },
      rhythm: {
        mode: "custom",
        selection: {
          recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 5 },
          source: "recipe",
        },
      },
    };
    const plan = createPartSequencePlaybackPlan(session);

    expect(plan.countIn).toEqual({ durationBeats: 3, pulses: 3 });
    expect(plan.parts[0]?.durationBeats).toBe(5);
    expect(plan.parts[0]?.rhythmRequests[0]?.pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 5,
      meter: { beats: 5, beatUnit: 4 },
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
              rhythm: { mode: "session" },
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
