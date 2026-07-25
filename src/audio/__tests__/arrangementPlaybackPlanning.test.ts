import { describe, expect, it } from "vitest";
import { createArrangementPlaybackRequest } from "@/audio";
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
    sections: [
      {
        id: "a",
        name: "A",
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
        name: "B",
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
});
