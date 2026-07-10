import { describe, expect, it } from "vitest";
import { createTestStore, sessionId } from "./appStoreTestUtils";

describe("Part actions", () => {
  it("sets Part Length independently of its Rhythm modules", () => {
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
      store.getState().sessions[sessionId]?.parts.at(-1)?.lengthBeats,
    ).toBe(6);

    store.getState().setPartLengthBeats(sessionId, partId!, 2);

    const part = store.getState().sessions[sessionId]?.parts.at(-1);
    expect(part?.lengthBeats).toBe(2);
    expect(part?.modules[0]).toMatchObject({
      rhythm: { recipe: { beats: 6 } },
    });
  });

  it("ignores invalid Part Length values", () => {
    const store = createTestStore();
    const partId = store.getState().addPart(sessionId);
    store.getState().setPartLengthBeats(sessionId, partId!, 0);

    expect(
      store.getState().sessions[sessionId]?.parts.at(-1)?.lengthBeats,
    ).toBe(4);
  });
});
