import { describe, expect, it } from "vitest";
import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";

describe("createSessionEntities", () => {
  it("creates a music part with an initial module request", () => {
    const part = createDefaultMusicPartConfig({
      rootNote: "D",
      noteCollectionKey: "minor",
      initialModule: {
        type: "instrument",
        settings: {
          instrumentType: "keyboard",
        },
      },
    });

    expect(part.rootNote).toBe("D");
    expect(part.noteCollectionKey).toBe("minor");
    expect(part.modules).toHaveLength(1);
    expect(part.modules[0]).toMatchObject({
      type: "instrument",
      instrument: {
        type: "keyboard",
      },
    });
  });

  it("creates a music part with an initial drone module request", () => {
    const part = createDefaultMusicPartConfig({
      rootNote: "C",
      noteCollectionKey: "major",
      initialModule: {
        type: "drone",
      },
    });

    expect(part.modules).toHaveLength(1);
    expect(part.modules[0]).toMatchObject({
      type: "drone",
    });
  });
});
