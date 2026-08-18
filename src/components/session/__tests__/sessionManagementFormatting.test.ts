import { describe, expect, it } from "vitest";
import { getSessionSubtitle } from "../sessionManagementFormatting";

describe("getSessionSubtitle", () => {
  it("keeps an empty Session summary concise", () => {
    expect(getSessionSubtitle([], 120)).toBe("No Parts Yet");
  });

  it("shows the musical identity and tempo for a one-Part Session", () => {
    expect(
      getSessionSubtitle(
        [{ id: "part-1", rootNote: "C", noteCollectionKey: "major" }],
        120,
      ),
    ).toBe("1 Part • C • 120 BPM");
  });

  it("previews only the first musical identity for a multi-Part Session", () => {
    expect(
      getSessionSubtitle(
        [
          { id: "part-1", rootNote: "C", noteCollectionKey: "major" },
          { id: "part-2", rootNote: "A", noteCollectionKey: "minor" },
        ],
        96,
      ),
    ).toBe("2 Parts • Starts with C • 96 BPM");
  });
});
