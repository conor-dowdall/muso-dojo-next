import { describe, expect, it } from "vitest";
import { createPartSequencePlaybackPlan } from "@/audio/partSequencePlanning";
import { RHYTHM_PPQ } from "@/data/rhythmPresets";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";

function createPart(
  id: string,
  modules: MusicPartConfig["modules"],
): MusicPartConfig {
  return {
    id,
    modules,
    noteCollectionKey: "major",
    rootNote: "C",
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
  it("uses the first rhythm cycle before exercise duration", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [
          {
            id: "exercise",
            type: "exercise-looper",
          },
          {
            id: "rhythm",
            rhythm: DEFAULT_RHYTHM_SELECTION,
            type: "rhythm",
          },
        ]),
      ]),
    );

    expect(plan.parts[0]).toMatchObject({
      durationBeats: 4,
      partId: "part",
    });
    expect(plan.parts[0]?.rhythmRequest?.pattern.cycleTicks).toBe(
      RHYTHM_PPQ * 4,
    );
    expect(plan.parts[0]?.exerciseRequest).toBeDefined();
  });

  it("uses the first rhythm cycle even when drums are muted", () => {
    const plan = createPartSequencePlaybackPlan({
      ...createSession([
        createPart("part", [
          {
            id: "exercise",
            type: "exercise-looper",
          },
          {
            id: "rhythm",
            rhythm: {
              recipe: {
                ...DEFAULT_RHYTHM_SELECTION.recipe,
                beats: 6,
              },
              source: "recipe",
            },
            type: "rhythm",
          },
        ]),
      ]),
      practiceBand: { drums: false },
    });

    expect(plan.parts[0]?.durationBeats).toBe(6);
    expect(plan.parts[0]?.exerciseRequest?.id).toBe("exercise");
    expect(plan.parts[0]?.rhythmRequest).toBeUndefined();
  });

  it("adds a default looper and drums when a part has no playable module", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([createPart("part", [])]),
    );

    expect(plan.parts[0]).toMatchObject({
      durationBeats: 4,
      exerciseRequest: {
        countInBeats: 0,
        id: "part-sequence-looper:part",
        metronomeEnabled: false,
        presetId: "plucked-string",
      },
      index: 0,
      partId: "part",
      rhythmRequest: {
        id: "part-sequence-drums:part",
      },
    });
    expect(plan.parts[0]?.exerciseRequest?.events[0]?.midi).toBe(36);
    expect(plan.parts[0]?.rhythmRequest?.pattern.cycleTicks).toBe(
      RHYTHM_PPQ * 4,
    );
  });

  it("keeps the default looper when drums are muted globally", () => {
    const plan = createPartSequencePlaybackPlan({
      ...createSession([
        createPart("part", [
          {
            id: "exercise",
            type: "exercise-looper",
          },
          {
            id: "rhythm",
            rhythm: DEFAULT_RHYTHM_SELECTION,
            type: "rhythm",
          },
        ]),
      ]),
      practiceBand: { drums: false },
    });

    expect(plan.parts[0]).toMatchObject({
      durationBeats: 4,
      exerciseRequest: {
        id: "exercise",
      },
      index: 0,
      partId: "part",
    });
    expect(plan.parts[0]?.rhythmRequest).toBeUndefined();
  });

  it("uses the first looper and first rhythm by module order", () => {
    const plan = createPartSequencePlaybackPlan(
      createSession([
        createPart("part", [
          {
            id: "rhythm-a",
            rhythm: DEFAULT_RHYTHM_SELECTION,
            type: "rhythm",
          },
          {
            id: "rhythm-b",
            rhythm: DEFAULT_RHYTHM_SELECTION,
            type: "rhythm",
          },
          {
            id: "exercise-a",
            type: "exercise-looper",
          },
          {
            id: "exercise-b",
            type: "exercise-looper",
          },
        ]),
      ]),
    );

    expect(plan.parts[0]?.rhythmRequest?.id).toBe("rhythm-a");
    expect(plan.parts[0]?.exerciseRequest?.id).toBe("exercise-a");
  });

  it("keeps content signature stable when only tempo changes", () => {
    const part = createPart("part", [
      {
        id: "rhythm",
        rhythm: DEFAULT_RHYTHM_SELECTION,
        type: "rhythm",
      },
    ]);
    const slowPlan = createPartSequencePlaybackPlan({
      ...createSession([part]),
      tempoBpm: 60,
    });
    const fastPlan = createPartSequencePlaybackPlan({
      ...createSession([part]),
      tempoBpm: 140,
    });

    expect(slowPlan.contentSignature).toBe(fastPlan.contentSignature);
    expect(slowPlan.signature).not.toBe(fastPlan.signature);
  });

  it("keeps the source signature stable when only drum mute changes", () => {
    const session = createSession([createPart("part", [])]);
    const fullPlan = createPartSequencePlaybackPlan(session);
    const quietPlan = createPartSequencePlaybackPlan({
      ...session,
      practiceBand: {
        drums: false,
      },
    });

    expect(fullPlan.sourceSignature).toBe(quietPlan.sourceSignature);
    expect(fullPlan.contentSignature).not.toBe(quietPlan.contentSignature);
  });

  it("uses Practice Band sound and octave for generated looper requests", () => {
    const plan = createPartSequencePlaybackPlan({
      ...createSession([createPart("part", [])]),
      practiceBand: {
        audioPresetId: "piano",
        octaveOffset: 0,
      },
    });

    expect(plan.parts[0]?.exerciseRequest?.presetId).toBe("piano");
    expect(plan.parts[0]?.exerciseRequest?.events[0]?.midi).toBe(48);
  });

  it("does not apply Practice Band sound or octave to explicit loopers", () => {
    const plan = createPartSequencePlaybackPlan({
      ...createSession([
        createPart("part", [
          {
            id: "exercise",
            type: "exercise-looper",
          },
        ]),
      ]),
      practiceBand: {
        audioPresetId: "piano",
        octaveOffset: 0,
      },
    });

    expect(plan.parts[0]?.exerciseRequest?.presetId).toBe("plucked-string");
    expect(plan.parts[0]?.exerciseRequest?.events[0]?.midi).toBe(36);
  });
});
