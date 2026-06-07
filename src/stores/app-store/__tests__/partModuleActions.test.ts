import { describe, expect, it } from "vitest";
import { createTestStore, partId, sessionId } from "./appStoreTestUtils";

describe("part module app store actions", () => {
  it("adds a module from a correlated creation request", () => {
    const store = createTestStore();

    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "instrument",
      settings: {
        instrumentType: "keyboard",
      },
    });

    const modules = store.getState().sessions[sessionId]?.parts[0]?.modules;
    expect(addedModuleId).toEqual(expect.any(String));
    expect(modules).toHaveLength(2);
    expect(modules?.[1]).toMatchObject({
      id: addedModuleId,
      type: "instrument",
      instrument: {
        type: "keyboard",
      },
    });
  });

  it("adds a drone module", () => {
    const store = createTestStore();

    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
    });

    expect(addedModuleId).toEqual(expect.any(String));

    if (!addedModuleId) {
      throw new Error("Expected a drone module id");
    }

    const addedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === addedModuleId);

    expect(addedModule).toMatchObject({
      id: addedModuleId,
      type: "drone",
    });
  });

  it("adds a drone with its selected wood", () => {
    const store = createTestStore();

    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
      settings: {
        wood: "ebony",
      },
    });
    const addedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === addedModuleId);

    expect(addedModule).toMatchObject({
      id: addedModuleId,
      type: "drone",
      wood: "ebony",
    });
  });

  it("adds multiple modules in order", () => {
    const store = createTestStore();

    const addedModuleIds = store.getState().addPartModules(sessionId, partId, [
      {
        type: "instrument",
        settings: {
          instrumentType: "keyboard",
        },
      },
      {
        type: "drone",
      },
    ]);

    const modules = store.getState().sessions[sessionId]?.parts[0]?.modules;

    expect(addedModuleIds).toHaveLength(2);
    expect(modules).toHaveLength(3);
    expect(modules?.slice(1).map((module) => module.id)).toEqual(
      addedModuleIds,
    );
    expect(modules?.[1]).toMatchObject({
      type: "instrument",
      instrument: {
        type: "keyboard",
      },
    });
    expect(modules?.[2]).toMatchObject({
      type: "drone",
    });
  });

  it("clones a drone module", () => {
    const store = createTestStore();
    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
    });

    if (!addedModuleId) {
      throw new Error("Expected a drone module id");
    }

    const clonedModuleId = store
      .getState()
      .clonePartModule(sessionId, partId, addedModuleId);
    const clonedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === clonedModuleId);

    expect(clonedModuleId).toEqual(expect.any(String));
    expect(clonedModuleId).not.toBe(addedModuleId);
    expect(clonedModule).toMatchObject({
      id: clonedModuleId,
      type: "drone",
    });
  });

  it("updates drone module settings", () => {
    const store = createTestStore();
    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
    });

    if (!addedModuleId) {
      throw new Error("Expected a drone module id");
    }

    store
      .getState()
      .setDroneAudioPresetId(sessionId, partId, addedModuleId, "warm-pad");
    store.getState().setDroneOctaveOffset(sessionId, partId, addedModuleId, 4);
    store.getState().setDroneOctaveOffset(sessionId, partId, addedModuleId, 5);
    store.getState().setDroneNoteCount(sessionId, partId, addedModuleId, 5);
    store.getState().setDroneWood(sessionId, partId, addedModuleId, "maple");

    const updatedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === addedModuleId);

    expect(updatedModule).toMatchObject({
      audioPresetId: "warm-pad",
      id: addedModuleId,
      noteCount: 5,
      octaveOffset: 4,
      type: "drone",
      wood: "maple",
    });
  });

  it("omits default drone module settings after updates", () => {
    const store = createTestStore();
    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
    });

    if (!addedModuleId) {
      throw new Error("Expected a drone module id");
    }

    store
      .getState()
      .setDroneAudioPresetId(sessionId, partId, addedModuleId, "warm-pad");
    store
      .getState()
      .setDroneAudioPresetId(
        sessionId,
        partId,
        addedModuleId,
        "reference-tone",
      );
    store.getState().setDroneOctaveOffset(sessionId, partId, addedModuleId, 1);
    store.getState().setDroneOctaveOffset(sessionId, partId, addedModuleId, 0);
    store.getState().setDroneNoteCount(sessionId, partId, addedModuleId, 2);
    store.getState().setDroneNoteCount(sessionId, partId, addedModuleId, 3);
    store.getState().setDroneWood(sessionId, partId, addedModuleId, "maple");
    store.getState().setDroneWood(sessionId, partId, addedModuleId, "rosewood");

    const updatedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === addedModuleId);

    expect(updatedModule).toStrictEqual({
      id: addedModuleId,
      type: "drone",
    });
  });

  it("adds and updates an exercise looper", () => {
    const store = createTestStore();
    const moduleId = store.getState().addPartModule(sessionId, partId, {
      type: "exercise-looper",
      settings: { wood: "ebony" },
    });

    if (!moduleId) {
      throw new Error("Expected an exercise looper module id");
    }

    const state = store.getState();
    state.setExerciseLooperAudioPresetId(
      sessionId,
      partId,
      moduleId,
      "glass-bell",
    );
    state.setExerciseLooperPattern(sessionId, partId, moduleId, {
      degree: 3,
      direction: "descending",
      mode: "interval",
    });
    state.setExerciseLooperSubdivision(
      sessionId,
      partId,
      moduleId,
      "sixteenth",
    );
    state.setExerciseLooperEnd(sessionId, partId, moduleId, {
      octave: 1,
      stepOffset: 2,
    });

    const partModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidate) => candidate.id === moduleId);

    expect(partModule).toMatchObject({
      audioPresetId: "glass-bell",
      end: { octave: 1, stepOffset: 2 },
      id: moduleId,
      pattern: { degree: 3, direction: "descending", mode: "interval" },
      subdivision: "sixteenth",
      type: "exercise-looper",
      wood: "ebony",
    });
  });
});
