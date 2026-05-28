import { describe, expect, it } from "vitest";
import { createTestStore, partId, sessionId } from "./appStoreTestUtils";

describe("part app store actions", () => {
  it("sets and normalizes the music part layout", () => {
    const store = createTestStore();

    store.getState().setPartLayout(sessionId, partId, "row");

    expect(store.getState().sessions[sessionId]?.parts[0]?.layout).toBe("row");

    store.getState().setPartLayout(sessionId, partId, "column");

    expect(store.getState().sessions[sessionId]?.parts[0]).not.toHaveProperty(
      "layout",
    );
  });
});
