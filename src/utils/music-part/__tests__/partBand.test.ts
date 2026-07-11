import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import {
  getPartBandConfig,
  isPartBandModule,
  normalizePartBandConfig,
  reconcilePartBandAfterModuleRemoval,
  setPartBandSource,
} from "@/utils/music-part/partBand";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";

function createPart(patch: Partial<MusicPartConfig> = {}): MusicPartConfig {
  return {
    id: "part",
    modules: [
      { id: "looper-a", type: "exercise-looper" },
      { id: "looper-b", type: "exercise-looper" },
      { id: "rhythm-a", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
      { id: "rhythm-b", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
    ],
    noteCollectionKey: "major",
    rootNote: "C",
    ...patch,
  };
}

describe("Part band sources", () => {
  it("migrates an unconfigured Part to its first module in each role", () => {
    expect(getPartBandConfig(createPart())).toEqual({
      backingNotes: { mode: "module", moduleId: "looper-a" },
      rhythm: { mode: "module", moduleId: "rhythm-a" },
    });
  });

  it("preserves explicit Session choices when modules exist", () => {
    const part = createPart({
      band: {
        backingNotes: { mode: "session" },
        rhythm: { mode: "session" },
      },
    });

    expect(getPartBandConfig(part)).toEqual(part.band);
  });

  it("rejects a module from the wrong role", () => {
    expect(
      normalizePartBandConfig(
        {
          backingNotes: { mode: "module", moduleId: "rhythm-a" },
          rhythm: { mode: "module", moduleId: "looper-a" },
        },
        createPart().modules,
      ),
    ).toEqual({
      backingNotes: { mode: "session" },
      rhythm: { mode: "session" },
    });
  });

  it("selects exactly one module in a role", () => {
    const part = setPartBandSource(createPart(), "backingNotes", {
      mode: "module",
      moduleId: "looper-b",
    });

    expect(isPartBandModule(part, "backingNotes", "looper-a")).toBe(false);
    expect(isPartBandModule(part, "backingNotes", "looper-b")).toBe(true);
  });

  it("returns to Session Default when the selected Rhythm is removed", () => {
    const part = createPart({
      band: {
        backingNotes: { mode: "module", moduleId: "looper-a" },
        rhythm: { mode: "module", moduleId: "rhythm-b" },
      },
    });

    expect(reconcilePartBandAfterModuleRemoval(part, "rhythm-b")).toMatchObject(
      {
        band: { rhythm: { mode: "session" } },
      },
    );
  });
});
