import { describe, expect, it } from "vitest";
import { createTestStore, partId, sessionId } from "./appStoreTestUtils";
import { getPartLengthBeats } from "@/utils/music-part/partLength";

function addRangeModules(store: ReturnType<typeof createTestStore>) {
  const droneId = store
    .getState()
    .addPartModule(sessionId, partId, { type: "drone" });
  const looperId = store
    .getState()
    .addPartModule(sessionId, partId, { type: "exercise-looper" });

  if (!droneId || !looperId) {
    throw new Error("Expected range module IDs");
  }

  store.getState().setDroneNoteCount(sessionId, partId, droneId, 2);
  store.getState().setDroneOctaveOffset(sessionId, partId, droneId, 1);
  store.getState().setExerciseLooperStart(sessionId, partId, looperId, {
    octave: 0,
    stepOffset: 1,
  });
  store.getState().setExerciseLooperEnd(sessionId, partId, looperId, {
    octave: 1,
    stepOffset: 1,
  });
  store
    .getState()
    .setExerciseLooperSubdivision(sessionId, partId, looperId, "2-per-beat");

  return { droneId, looperId };
}

function getRangeModules(
  store: ReturnType<typeof createTestStore>,
  droneId: string,
  looperId: string,
) {
  const modules = store.getState().sessions[sessionId]?.parts[0]?.modules;

  return {
    drone: modules?.find((module) => module.id === droneId),
    looper: modules?.find((module) => module.id === looperId),
  };
}

describe("Part actions", () => {
  it("preserves module note ranges when Note Collections share a range shape", () => {
    const store = createTestStore();
    const { droneId, looperId } = addRangeModules(store);

    store.getState().setPartNoteCollectionKey(sessionId, partId, "minor");

    expect(getRangeModules(store, droneId, looperId)).toMatchObject({
      drone: { noteCount: 2 },
      looper: {
        end: { octave: 1, stepOffset: 1 },
        start: { octave: 0, stepOffset: 1 },
      },
    });
  });

  it("resets module note ranges when the Note Collection length changes", () => {
    const store = createTestStore();
    const { droneId, looperId } = addRangeModules(store);

    store.getState().setPartNoteCollectionKey(sessionId, partId, "ionian");

    const { drone, looper } = getRangeModules(store, droneId, looperId);
    expect(drone).not.toHaveProperty("noteCount");
    expect(drone).toMatchObject({ octaveOffset: 1 });
    expect(looper).not.toHaveProperty("end");
    expect(looper).not.toHaveProperty("start");
    expect(looper).toMatchObject({ subdivision: "2-per-beat" });
  });

  it("resets module note ranges when finite presentation changes", () => {
    const store = createTestStore();
    store
      .getState()
      .setPartNoteCollectionKey(sessionId, partId, "majorPentatonic");
    const { droneId, looperId } = addRangeModules(store);

    store.getState().setPartNoteCollectionKey(sessionId, partId, "major9");

    const { drone, looper } = getRangeModules(store, droneId, looperId);
    expect(drone).not.toHaveProperty("noteCount");
    expect(looper).not.toHaveProperty("end");
    expect(looper).not.toHaveProperty("start");
  });

  it("preserves module note ranges when the Part root changes", () => {
    const store = createTestStore();
    const { droneId, looperId } = addRangeModules(store);

    store.getState().setPartRootNote(sessionId, partId, "D");

    expect(getRangeModules(store, droneId, looperId)).toMatchObject({
      drone: { noteCount: 2 },
      looper: {
        end: { octave: 1, stepOffset: 1 },
        start: { octave: 0, stepOffset: 1 },
      },
    });
  });

  it("uses a selected Rhythm module for length and four beats for Automatic", () => {
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
                  subdivision: "2-per-beat",
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
    ).toEqual({ style: "standard" });

    expect(
      getPartLengthBeats(
        store.getState().sessions[sessionId]?.parts.at(-1) ?? {},
      ),
    ).toBe(6);

    const part = store.getState().sessions[sessionId]?.parts.at(-1);
    expect(getPartLengthBeats(part ?? {})).toBe(6);
    expect(part?.modules[0]).toMatchObject({
      rhythm: { recipe: { beats: 6 } },
    });

    store.getState().setPartBandSource(sessionId, partId!, "rhythm", {
      mode: "session",
    });
    expect(
      getPartLengthBeats(
        store.getState().sessions[sessionId]?.parts.at(-1) ?? {},
      ),
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

  it("keeps module IDs unique when the same Part is cloned repeatedly", () => {
    const store = createTestStore();
    const originalPartId = store.getState().sessions[sessionId]?.parts[0]?.id;

    if (!originalPartId) {
      throw new Error("Expected an original Part");
    }

    store
      .getState()
      .addPartModule(sessionId, originalPartId, { type: "exercise-looper" });
    store
      .getState()
      .addPartModule(sessionId, originalPartId, { type: "rhythm" });

    const firstCloneId = store.getState().clonePart(sessionId, originalPartId);
    const secondCloneId = store.getState().clonePart(sessionId, originalPartId);
    const parts = store.getState().sessions[sessionId]?.parts ?? [];
    const moduleIds = parts.flatMap((part) =>
      part.modules.map((module) => module.id),
    );
    const firstClone = parts.find((part) => part.id === firstCloneId);
    const secondClone = parts.find((part) => part.id === secondCloneId);

    expect(new Set(moduleIds).size).toBe(moduleIds.length);
    expect(firstCloneId).toBeDefined();
    expect(secondCloneId).toBeDefined();
    expect(firstClone?.modules.map((module) => module.id)).not.toEqual(
      secondClone?.modules.map((module) => module.id),
    );
  });
});
