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

  it("retains only strict integer Entry tempo overrides", () => {
    const normalizeOverride = (tempoOverrideBpm: unknown) =>
      normalizeArrangementConfig({
        sections: [{ id: "section", parts: [] }],
        entries: [{ id: "entry", sectionId: "section", tempoOverrideBpm }],
      }).entries[0]?.tempoOverrideBpm;

    expect(normalizeOverride(30)).toBe(30);
    expect(normalizeOverride(300)).toBe(300);
    expect(normalizeOverride(79.6)).toBeUndefined();
    expect(normalizeOverride(301)).toBeUndefined();
    expect(normalizeOverride("120")).toBeUndefined();
  });

  it("normalizes an enabled Arrangement ending and leaves missing endings off", () => {
    expect(
      normalizeArrangementConfig({
        ending: {
          audioPresetId: "bowed-strings",
          octaveOffset: 1,
          rootNote: "F#",
        },
      }).ending,
    ).toEqual({
      audioPresetId: "bowed-strings",
      octaveOffset: 1,
      rootNote: "F♯",
    });
    expect(
      normalizeArrangementConfig({
        ending: {
          audioPresetId: "invalid",
          octaveOffset: 100,
          rootNote: "invalid",
        },
      }).ending,
    ).toEqual({
      audioPresetId: "acoustic-bass",
      octaveOffset: -1,
      rootNote: "C",
    });
    expect(normalizeArrangementConfig({})).not.toHaveProperty("ending");
  });

  it("repairs Module collisions across a captured Section graph", () => {
    const arrangement = normalizeArrangementConfig({
      sections: [
        {
          id: "section",
          parts: [
            {
              id: "part-1",
              modules: [
                {
                  id: "shared-module",
                  rhythm: { source: "recipe" },
                  type: "rhythm",
                },
              ],
            },
            {
              band: {
                rhythm: { mode: "module", moduleId: "shared-module" },
              },
              id: "part-2",
              modules: [
                {
                  id: "shared-module",
                  rhythm: { source: "recipe" },
                  type: "rhythm",
                },
              ],
            },
          ],
        },
        {
          id: "section-2",
          parts: [
            {
              id: "part-1",
              modules: [
                {
                  id: "shared-module",
                  instrument: { type: "keyboard" },
                  type: "instrument",
                },
              ],
            },
          ],
        },
      ],
      entries: [
        { id: "entry", sectionId: "section" },
        { id: "entry-2", sectionId: "section-2" },
      ],
    });
    const parts = arrangement.sections[0]?.parts;
    const secondSectionPart = arrangement.sections[1]?.parts[0];

    expect(parts?.[0]?.modules[0]?.id).toBe("shared-module");
    expect(parts?.[1]?.modules[0]?.id).toBe("shared-module-copy");
    expect(parts?.[1]?.band?.rhythm).toEqual({
      mode: "module",
      moduleId: "shared-module-copy",
    });
    expect(secondSectionPart?.id).toBe("part-1-copy");
    expect(secondSectionPart?.modules[0]?.id).toBe("shared-module-copy-2");
  });
});
