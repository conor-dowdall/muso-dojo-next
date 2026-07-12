import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { resolvePartBackingBand } from "../resolvePartBackingBand";

function createPart(patch: Partial<MusicPartConfig> = {}): MusicPartConfig {
  return {
    id: "part",
    rootNote: "C",
    noteCollectionKey: "major",
    modules: [],
    ...patch,
  };
}

function rhythmSelection(beats: number) {
  return {
    recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats },
    source: "recipe" as const,
  };
}

describe("resolvePartBackingBand", () => {
  it("resolves live Session settings for a Part that follows the Session", () => {
    const part = createPart({ durationInBars: 0.5 });
    const session = createDefaultSessionBackingBandConfig();
    const initial = resolvePartBackingBand(part, session);
    const updated = resolvePartBackingBand(part, {
      ...session,
      looper: { ...session.looper, enabled: false },
      rhythm: { ...session.rhythm, mode: "off" },
    });

    expect(initial).toMatchObject({
      backingNotes: { enabled: true, source: { mode: "session" } },
      durationBeats: 2,
      rhythm: { enabled: true, source: { mode: "session" } },
    });
    expect(updated).toMatchObject({
      backingNotes: { enabled: false, source: { mode: "session" } },
      durationBeats: 2,
      rhythm: { enabled: false, source: { mode: "session" } },
    });
  });

  it("uses a fixed Custom Session Rhythm length instead of authored duration", () => {
    const session = createDefaultSessionBackingBandConfig();
    const resolved = resolvePartBackingBand(
      createPart({ durationInBars: 0.5 }),
      {
        ...session,
        rhythm: { mode: "custom", selection: rhythmSelection(5) },
      },
    );

    expect(resolved.durationBeats).toBe(5);
    expect(resolved.perPartDurationBeats).toBe(2);
    expect(resolved.rhythm.selection).toMatchObject({ recipe: { beats: 5 } });
  });

  it("lets local modules override disabled Session lanes", () => {
    const session = createDefaultSessionBackingBandConfig();
    const resolved = resolvePartBackingBand(
      createPart({
        band: {
          backingNotes: { mode: "module", moduleId: "looper" },
          rhythm: { mode: "module", moduleId: "rhythm" },
        },
        durationInBars: 0.5,
        modules: [
          { id: "looper", type: "exercise-looper" },
          { id: "rhythm", rhythm: rhythmSelection(6), type: "rhythm" },
        ],
      }),
      {
        ...session,
        looper: { ...session.looper, enabled: false },
        rhythm: { ...session.rhythm, mode: "off" },
      },
    );

    expect(resolved).toMatchObject({
      backingNotes: {
        enabled: true,
        module: { id: "looper" },
        source: { mode: "module", moduleId: "looper" },
      },
      durationBeats: 6,
      rhythm: {
        enabled: true,
        module: { id: "rhythm" },
        source: { mode: "module", moduleId: "rhythm" },
      },
    });
  });

  it("keeps an explicitly muted Part lane off", () => {
    const resolved = resolvePartBackingBand(
      createPart({
        band: {
          backingNotes: { mode: "off" },
          rhythm: { mode: "off" },
        },
      }),
    );

    expect(resolved.backingNotes.enabled).toBe(false);
    expect(resolved.rhythm.enabled).toBe(false);
    expect(resolved.durationBeats).toBe(4);
  });
});
