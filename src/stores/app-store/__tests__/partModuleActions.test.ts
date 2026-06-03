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
});
