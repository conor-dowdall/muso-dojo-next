import { describe, expect, it } from "vitest";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";

describe("createChordProgressionParts", () => {
  it("copies the requested module set to every progression part", () => {
    const parts = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "oneOneFiveFive",
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
      ],
    });

    expect(parts.length).toBeGreaterThan(0);

    parts.forEach((part) => {
      expect(part.modules).toHaveLength(3);
      expect(part.modules.map((module) => module.type)).toEqual([
        "instrument",
        "instrument",
        "drone",
      ]);
      expect(part.modules[0]).toMatchObject({
        instrument: {
          type: "fretboard",
        },
      });
      expect(part.modules[1]).toMatchObject({
        instrument: {
          type: "keyboard",
        },
      });
    });
  });
});
