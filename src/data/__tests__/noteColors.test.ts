import { colorCollections } from "@musodojo/music-theory-data";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_COLOR_PRESET,
  DEFAULT_NOTE_COLOR_VALUES,
  getDefaultNoteColorValue,
} from "@/data/noteColors";
import { getSessionNoteColorVariable } from "@/utils/note-colors/resolveNoteColors";

describe("note colors", () => {
  it("uses the Muso Dojo package colors as the app default note colors", () => {
    expect(DEFAULT_NOTE_COLOR_VALUES).toEqual(
      colorCollections[DEFAULT_NOTE_COLOR_PRESET].colors,
    );
  });

  it("normalizes default note color lookups by pitch class", () => {
    expect(getDefaultNoteColorValue(12)).toBe(DEFAULT_NOTE_COLOR_VALUES[0]);
    expect(getDefaultNoteColorValue(-1)).toBe(DEFAULT_NOTE_COLOR_VALUES[11]);
  });

  it("uses package colors as session note color variable fallbacks", () => {
    expect(getSessionNoteColorVariable(0)).toBe(
      `var(--session-note-color-0, ${DEFAULT_NOTE_COLOR_VALUES[0]})`,
    );
    expect(getSessionNoteColorVariable(13)).toBe(
      `var(--session-note-color-1, ${DEFAULT_NOTE_COLOR_VALUES[1]})`,
    );
  });
});
