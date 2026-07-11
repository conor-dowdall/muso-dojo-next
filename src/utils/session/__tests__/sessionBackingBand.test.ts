import { describe, expect, it } from "vitest";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import {
  createDefaultSessionBackingBandConfig,
  normalizeSessionBackingBandConfig,
} from "@/utils/session/sessionBackingBand";

describe("Session Backing Band", () => {
  it("uses musician-friendly built-in defaults", () => {
    expect(createDefaultSessionBackingBandConfig()).toEqual({
      countInBeats: 4,
      looper: {
        audioPresetId: "plucked-string",
        enabled: true,
        octaveOffset: -1,
      },
      rhythm: {
        mode: "automatic",
        selection: DEFAULT_RHYTHM_SELECTION,
      },
    });
  });

  it("normalizes valid custom settings", () => {
    const selection = {
      recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 5 },
      source: "recipe" as const,
    };

    expect(
      normalizeSessionBackingBandConfig({
        countInBeats: 3,
        looper: {
          audioPresetId: "piano",
          enabled: false,
          octaveOffset: 2,
        },
        rhythm: { mode: "custom", selection },
      }),
    ).toEqual({
      countInBeats: 3,
      looper: {
        audioPresetId: "piano",
        enabled: false,
        octaveOffset: 2,
      },
      rhythm: { mode: "custom", selection },
    });
  });
});
