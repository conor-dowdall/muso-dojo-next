import { describe, expect, it } from "vitest";
import { type ArrangementConfig } from "@/types/arrangement";
import { createArrangementEndingSeed } from "@/utils/arrangement/arrangementEnding";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";

describe("createArrangementEndingSeed", () => {
  it("uses the first Part tonal centre and effective backing-note voice once", () => {
    const arrangement: ArrangementConfig = {
      id: "arrangement",
      name: "Song",
      lastModified: "2026-08-16T00:00:00.000Z",
      tempoBpm: 120,
      playbackMode: "once",
      workspaceViewMode: "build",
      entries: [{ id: "entry", sectionId: "section", playCount: 1 }],
      sections: [
        {
          id: "section",
          backingBand: createDefaultSessionBackingBandConfig(),
          parts: [
            {
              authoredProgression: {
                kind: "chord-progression",
                noteCollectionKey: "dominant7",
                progressionInstanceId: "cadence",
                romanSymbol: "V7",
                rootNote: "G",
                source: {
                  kind: "built-in",
                  progressionKey: "authenticCadence",
                },
                tonalCenter: "C",
              },
              band: {
                backingNotes: { mode: "module", moduleId: "looper" },
                rhythm: { mode: "session" },
              },
              id: "part",
              modules: [
                {
                  audioPresetId: "piano",
                  id: "looper",
                  octaveOffset: 1,
                  type: "exercise-looper",
                },
              ],
              noteCollectionKey: "dominant7",
              rootNote: "G",
            },
          ],
          source: {
            capturedAt: "2026-08-16T00:00:00.000Z",
            sessionId: "session",
            sessionLastModified: "2026-08-16T00:00:00.000Z",
            sessionName: "Cadence",
            sessionTempoBpm: 120,
          },
        },
      ],
    };

    expect(createArrangementEndingSeed(arrangement)).toEqual({
      audioPresetId: "piano",
      octaveOffset: 1,
      rootNote: "C",
    });
  });

  it("falls back to the app's simple band-ending defaults", () => {
    const arrangement = {
      id: "empty",
      name: "Empty",
      lastModified: "2026-08-16T00:00:00.000Z",
      tempoBpm: 80,
      playbackMode: "once",
      workspaceViewMode: "build",
      entries: [],
      sections: [],
    } satisfies ArrangementConfig;

    expect(createArrangementEndingSeed(arrangement)).toEqual({
      audioPresetId: "acoustic-bass",
      octaveOffset: -1,
      rootNote: "C",
    });
  });
});
