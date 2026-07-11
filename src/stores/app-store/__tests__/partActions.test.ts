import { describe, expect, it } from "vitest";
import { createTestStore, sessionId } from "./appStoreTestUtils";
import { getPartLengthBeats } from "@/utils/music-part/partLength";

describe("Part actions", () => {
  it("uses Automatic Rhythm beats only when no module owns the band", () => {
    const store = createTestStore();
    const partId = store.getState().addPart(sessionId, {
      moduleRequests: [
        {
          type: "rhythm",
          settings: {
            rhythm: {
              recipe: {
                beats: 6,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "eighth",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    expect(partId).toBeDefined();
    expect(
      store.getState().sessions[sessionId]?.parts.at(-1)?.automaticRhythm,
    ).toEqual({ beats: 4, style: "standard" });

    expect(
      getPartLengthBeats(
        store.getState().sessions[sessionId]?.parts.at(-1) ?? {},
      ),
    ).toBe(6);

    store.getState().setPartAutomaticRhythmBeats(sessionId, partId!, 2);

    const part = store.getState().sessions[sessionId]?.parts.at(-1);
    expect(part?.automaticRhythm?.beats).toBe(2);
    expect(getPartLengthBeats(part ?? {})).toBe(6);
    expect(part?.modules[0]).toMatchObject({
      rhythm: { recipe: { beats: 6 } },
    });

    store.getState().setPartBandSource(sessionId, partId!, "rhythm", {
      mode: "automatic",
    });
    expect(
      getPartLengthBeats(
        store.getState().sessions[sessionId]?.parts.at(-1) ?? {},
      ),
    ).toBe(2);
  });

  it("ignores invalid Automatic Rhythm beat values", () => {
    const store = createTestStore();
    const partId = store.getState().addPart(sessionId);
    store.getState().setPartAutomaticRhythmBeats(sessionId, partId!, 0);

    expect(
      store.getState().sessions[sessionId]?.parts.at(-1)?.automaticRhythm
        ?.beats,
    ).toBe(4);
  });

  it("remaps selected band sources when a Part is cloned", () => {
    const store = createTestStore();
    const originalPartId = store.getState().sessions[sessionId]?.parts[0]?.id;

    if (!originalPartId) {
      throw new Error("Expected an original Part");
    }

    const looperId = store
      .getState()
      .addPartModule(sessionId, originalPartId, { type: "exercise-looper" });
    const rhythmId = store
      .getState()
      .addPartModule(sessionId, originalPartId, { type: "rhythm" });
    const clonedPartId = store.getState().clonePart(sessionId, originalPartId);
    const clonedPart = store
      .getState()
      .sessions[sessionId]?.parts.find((part) => part.id === clonedPartId);
    const clonedLooper = clonedPart?.modules.find(
      (module) => module.type === "exercise-looper",
    );
    const clonedRhythm = clonedPart?.modules.find(
      (module) => module.type === "rhythm",
    );

    expect(clonedLooper?.id).not.toBe(looperId);
    expect(clonedRhythm?.id).not.toBe(rhythmId);
    expect(clonedPart?.band).toEqual({
      backingNotes: { mode: "module", moduleId: clonedLooper?.id },
      rhythm: { mode: "module", moduleId: clonedRhythm?.id },
    });
  });
});
