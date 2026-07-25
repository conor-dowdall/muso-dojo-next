import { describe, expect, it } from "vitest";
import { normalizeArrangementConfig } from "@/utils/arrangement/normalizeArrangementConfig";

describe("normalizeArrangementConfig", () => {
  it("normalizes limits, drops dangling Entries, and prunes unused Sections", () => {
    const arrangement = normalizeArrangementConfig({
      id: "song",
      name: " Song ",
      tempoBpm: 999,
      playbackMode: "invalid",
      sections: [
        { id: "used", parts: [] },
        { id: "unused", parts: [] },
      ],
      entries: [
        { id: "entry", sectionId: "used", playCount: 120 },
        { id: "dangling", sectionId: "missing", playCount: 1 },
      ],
    });

    expect(arrangement).toMatchObject({
      id: "song",
      name: "Song",
      tempoBpm: 300,
      playbackMode: "once",
      entries: [{ id: "entry", sectionId: "used", playCount: 16 }],
      sections: [{ id: "used", parts: [] }],
    });
  });

  it("ignores legacy serialized Section names", () => {
    const arrangement = normalizeArrangementConfig({
      sections: [{ id: "section", name: "Legacy Custom Name", parts: [] }],
      entries: [{ id: "entry", sectionId: "section" }],
    });

    expect(arrangement.sections[0]).not.toHaveProperty("name");
  });
});
