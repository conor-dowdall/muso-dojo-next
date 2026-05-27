import { describe, expect, it } from "vitest";
import { type InstrumentNoteInteractionMode } from "@/types/instrument";
import { resolveInstrumentNoteInteractionMode } from "@/utils/instrument/resolveInstrumentInteractionMode";

describe("resolveInstrumentNoteInteractionMode", () => {
  it.each([
    ["play", "play"],
    ["edit-one", "edit-one"],
    ["edit-pitch-class", "edit-pitch-class"],
  ] satisfies [InstrumentNoteInteractionMode, InstrumentNoteInteractionMode][])(
    "uses %s while unlocked",
    (noteInteractionMode, expectedMode) => {
      expect(
        resolveInstrumentNoteInteractionMode({
          activeNotesLocked: false,
          noteInteractionMode,
        }),
      ).toBe(expectedMode);
    },
  );

  it.each([
    "play",
    "edit-one",
    "edit-pitch-class",
  ] satisfies InstrumentNoteInteractionMode[])(
    "forces %s to play while locked",
    (noteInteractionMode) => {
      expect(
        resolveInstrumentNoteInteractionMode({
          activeNotesLocked: true,
          noteInteractionMode,
        }),
      ).toBe("play");
    },
  );
});
