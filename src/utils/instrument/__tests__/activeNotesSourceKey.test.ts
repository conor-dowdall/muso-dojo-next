import { describe, expect, it } from "vitest";
import {
  createActiveNotesDependencyKey,
  createActiveNotesSourceKey,
} from "@/utils/instrument/activeNotesSourceKey";

describe("active note source keys", () => {
  it("identifies the musical and instrument-topology source for custom notes", () => {
    const cMajorGuitar = createActiveNotesSourceKey({
      rootNote: "C",
      noteCollectionKey: "major",
      topologyKeys: ["64,59,55,50,45,40", "0,12"],
    });

    expect(cMajorGuitar).toBe('["C","major","64,59,55,50,45,40","0,12"]');
    expect(
      createActiveNotesSourceKey({
        rootNote: "Eb",
        noteCollectionKey: "major",
        topologyKeys: ["64,59,55,50,45,40", "0,12"],
      }),
    ).not.toBe(cMajorGuitar);
    expect(
      createActiveNotesSourceKey({
        rootNote: "C",
        noteCollectionKey: "minor",
        topologyKeys: ["64,59,55,50,45,40", "0,12"],
      }),
    ).not.toBe(cMajorGuitar);
    expect(
      createActiveNotesSourceKey({
        rootNote: "C",
        noteCollectionKey: "major",
        topologyKeys: ["64,59,55,50,45,40", "0,7"],
      }),
    ).not.toBe(cMajorGuitar);
  });

  it("keeps reset separate from source identity", () => {
    const sourceKey = createActiveNotesSourceKey({
      rootNote: "C",
      noteCollectionKey: "major",
      topologyKeys: ["21,108"],
    });

    expect(createActiveNotesDependencyKey(sourceKey, 0)).not.toBe(
      createActiveNotesDependencyKey(sourceKey, 1),
    );
    expect(sourceKey).toBe(
      createActiveNotesSourceKey({
        rootNote: "C",
        noteCollectionKey: "major",
        topologyKeys: ["21,108"],
      }),
    );
  });
});
