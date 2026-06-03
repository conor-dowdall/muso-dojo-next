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

  it("adds and updates a drone module", () => {
    const store = createTestStore();

    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
    });

    expect(addedModuleId).toEqual(expect.any(String));

    if (!addedModuleId) {
      throw new Error("Expected a drone module id");
    }

    store.getState().setDroneOctave(sessionId, partId, addedModuleId, 5);
    store
      .getState()
      .setDroneAudioPresetId(sessionId, partId, addedModuleId, "warm-pad");

    const addedModule = store
      .getState()
      .sessions[
        sessionId
      ]?.parts[0]?.modules.find((candidateModule) => candidateModule.id === addedModuleId);

    expect(addedModule).toMatchObject({
      id: addedModuleId,
      type: "drone",
      octave: 5,
      audioPresetId: "warm-pad",
    });
  });

  it("clones a drone module", () => {
    const store = createTestStore();
    const addedModuleId = store.getState().addPartModule(sessionId, partId, {
      type: "drone",
      settings: {
        octave: 4,
        audioPresetId: "warm-pad",
      },
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
      octave: 4,
      audioPresetId: "warm-pad",
    });
  });
});
