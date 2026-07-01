import { describe, expect, it } from "vitest";
import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";

describe("createSessionEntities", () => {
  it("creates a music part with module requests", () => {
    const part = createDefaultMusicPartConfig({
      rootNote: "D",
      noteCollectionKey: "minor",
      moduleRequests: [
        {
          type: "instrument",
          settings: {
            instrumentType: "fretboard",
          },
        },
        {
          type: "instrument",
          settings: {
            instrumentType: "keyboard",
          },
        },
        {
          type: "drone",
        },
        {
          type: "rhythm",
        },
      ],
    });

    expect(part.rootNote).toBe("D");
    expect(part.noteCollectionKey).toBe("minor");
    expect(part.modules).toHaveLength(4);
    expect(part.modules[0]).toMatchObject({
      type: "instrument",
      instrument: {
        type: "fretboard",
      },
    });
    expect(part.modules[1]).toMatchObject({
      type: "instrument",
      instrument: {
        type: "keyboard",
      },
    });
    expect(part.modules[2]).toMatchObject({
      type: "drone",
    });
    expect(part.modules[3]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 4,
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
      type: "rhythm",
    });
  });

  it("creates a music part without module requests", () => {
    const part = createDefaultMusicPartConfig({
      rootNote: "C",
      noteCollectionKey: "major",
    });

    expect(part.modules).toHaveLength(0);
  });

  it("applies representable Part durations to default Rhythm modules", () => {
    const part = createDefaultMusicPartConfig({
      durationInBars: 0.5,
      moduleRequests: [{ type: "rhythm" }],
    });

    expect(part).toMatchObject({
      durationInBars: 0.5,
      modules: [
        {
          rhythm: {
            recipe: {
              beats: 2,
            },
          },
          type: "rhythm",
        },
      ],
    });
  });

  it("uses custom rhythm creation defaults", () => {
    const part = createDefaultMusicPartConfig({
      moduleRequests: [
        {
          type: "rhythm",
          settings: {
            rhythm: {
              recipe: {
                beats: 4,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "swing",
                  sound: "ride",
                  subdivision: "eighth",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    expect(part.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 4,
          groove: "kit",
          timekeeper: {
            feel: "swing",
            sound: "ride",
            subdivision: "eighth",
          },
        },
      },
      type: "rhythm",
    });
  });

  it("applies representable Part durations without losing custom Rhythm feel", () => {
    const part = createDefaultMusicPartConfig({
      durationInBars: 0.5,
      moduleRequests: [
        {
          type: "rhythm",
          settings: {
            rhythm: {
              recipe: {
                beats: 4,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "shuffle",
                  sound: "shaker",
                  subdivision: "eighth",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    expect(part.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 2,
          groove: "kit",
          timekeeper: {
            feel: "shuffle",
            sound: "shaker",
            subdivision: "eighth",
          },
        },
      },
      type: "rhythm",
    });
  });
});
