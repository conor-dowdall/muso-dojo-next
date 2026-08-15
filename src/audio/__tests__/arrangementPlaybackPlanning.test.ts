import { describe, expect, it } from "vitest";
import {
  createArrangementEntryLoopPlaybackRequest,
  createArrangementPlaybackRequest,
  createArrangementPlaybackRequestFromEntry,
} from "@/audio";
import { type ArrangementConfig } from "@/types/arrangement";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";

function createArrangement(): ArrangementConfig {
  const backingBand = createDefaultSessionBackingBandConfig();
  backingBand.countInBeats = 2;
  return {
    id: "arrangement",
    name: "Song",
    lastModified: "2026-07-23T00:00:00.000Z",
    tempoBpm: 120,
    playbackMode: "once",
    workspaceViewMode: "build",
    sections: [
      {
        id: "a",
        backingBand,
        parts: [
          {
            id: "a-part",
            modules: [],
            noteCollectionKey: "major",
            rootNote: "C",
          },
        ],
        source: {
          capturedAt: "2026-07-23T00:00:00.000Z",
          sessionId: "session-a",
          sessionLastModified: "2026-07-23T00:00:00.000Z",
          sessionName: "A",
          sessionTempoBpm: 80,
        },
      },
      {
        id: "b",
        backingBand: createDefaultSessionBackingBandConfig(),
        parts: [
          {
            id: "b-part",
            modules: [],
            noteCollectionKey: "major",
            rootNote: "G",
          },
        ],
        source: {
          capturedAt: "2026-07-23T00:00:00.000Z",
          sessionId: "session-b",
          sessionLastModified: "2026-07-23T00:00:00.000Z",
          sessionName: "B",
          sessionTempoBpm: 90,
        },
      },
    ],
    entries: [
      { id: "entry-a", sectionId: "a", playCount: 2 },
      { id: "entry-b", sectionId: "b", playCount: 1 },
    ],
  };
}

describe("createArrangementPlaybackRequest", () => {
  it("expands Entry plays, namespaces steps, and always starts at the first Entry", () => {
    const request = createArrangementPlaybackRequest(createArrangement())!;
    expect(request.start).toEqual({
      startIndex: 0,
      countIn: { durationBeats: 2, pulses: 2 },
    });
    expect(request.plan).toMatchObject({
      completionPolicy: "stop-at-end",
      mode: "arrangement",
      owner: { kind: "arrangement", id: "arrangement" },
      tempoBpm: 120,
    });
    expect(request.plan.parts.map((step) => step.arrangement)).toMatchObject([
      { entryId: "entry-a", playIndex: 0, sectionId: "a" },
      { entryId: "entry-a", playIndex: 1, sectionId: "a" },
      { entryId: "entry-b", playIndex: 0, sectionId: "b" },
    ]);
    expect(new Set(request.plan.parts.map(({ stepId }) => stepId)).size).toBe(
      3,
    );
  });

  it("maps Loop mode and blocks referenced empty Sections", () => {
    const arrangement = createArrangement();
    arrangement.playbackMode = "loop";
    expect(
      createArrangementPlaybackRequest(arrangement)?.plan.completionPolicy,
    ).toBe("loop");
    arrangement.sections[1]!.parts = [];
    expect(createArrangementPlaybackRequest(arrangement)).toBeUndefined();
  });

  it("applies each Entry effective tempo to every expanded step and request", () => {
    const arrangement = createArrangement();
    arrangement.entries[0]!.tempoOverrideBpm = 90;
    const plan = createArrangementPlaybackRequest(arrangement)!.plan;

    expect(plan.tempoBpm).toBe(120);
    expect(plan.parts.map(({ tempoBpm }) => tempoBpm)).toEqual([90, 90, 120]);
    expect(
      plan.parts.flatMap(({ exerciseRequests }) =>
        exerciseRequests.map(({ tempoBpm }) => tempoBpm),
      ),
    ).toEqual([90, 90, 120]);
    expect(
      plan.parts.flatMap(({ rhythmRequests }) =>
        rhythmRequests.map(({ tempoBpm }) => tempoBpm),
      ),
    ).toEqual([90, 90, 120]);
    expect(plan.signature).toContain(plan.tempoSignature);
    expect(plan.sourceSignature).not.toContain("90");
  });

  it("creates an Arrangement-owned loop for one visible Entry only once", () => {
    const arrangement = createArrangement();
    arrangement.entries[0]!.tempoOverrideBpm = 95;
    const request = createArrangementEntryLoopPlaybackRequest(
      arrangement,
      "entry-a",
    )!;

    expect(request.plan).toMatchObject({
      completionPolicy: "loop",
      mode: "arrangement-entry-loop",
      owner: { kind: "arrangement", id: "arrangement" },
    });
    expect(request.plan.parts).toHaveLength(1);
    expect(request.plan.parts[0]).toMatchObject({
      arrangement: {
        entryId: "entry-a",
        playCount: 1,
        playIndex: 0,
      },
      tempoBpm: 95,
    });
    expect(request.start.countIn).toEqual({ durationBeats: 2, pulses: 2 });
  });

  it("starts from a visible Entry and retains the Arrangement completion setting", () => {
    const arrangement = createArrangement();
    arrangement.playbackMode = "loop";
    arrangement.sections[1]!.backingBand.countInBeats = 3;
    const request = createArrangementPlaybackRequestFromEntry(
      arrangement,
      "entry-b",
    )!;

    expect(request.start).toEqual({
      countIn: { durationBeats: 3, pulses: 3 },
      startIndex: 2,
    });
    expect(request.plan).toMatchObject({
      completionPolicy: "loop",
      mode: "arrangement-from-entry",
      owner: { kind: "arrangement", id: "arrangement" },
    });
    expect(
      request.plan.parts[request.start.startIndex]?.arrangement,
    ).toMatchObject({ entryId: "entry-b", playIndex: 0 });
    expect(
      createArrangementPlaybackRequestFromEntry(arrangement, "missing"),
    ).toBeUndefined();
  });
});
