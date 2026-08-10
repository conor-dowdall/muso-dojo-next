import { describe, expect, it } from "vitest";
import {
  NOTE_COLOR_NEUTRAL_VALUE,
  NOTE_COLOR_THEME_VALUE,
  createNoteColorTuple,
} from "@/data/noteColors";
import {
  createNoteColorStyle,
  getNoteColorIndex,
  resolveInstrumentNoteColor,
  resolveNoteColors,
} from "@/utils/note-colors/resolveNoteColors";

describe("resolveNoteColors", () => {
  it("uses theme colors by default", () => {
    const resolved = resolveNoteColors(undefined);

    expect(resolved).toStrictEqual({
      colors: createNoteColorTuple(
        Array.from({ length: 12 }, () => NOTE_COLOR_THEME_VALUE),
      ),
      mode: "absolute",
      source: "theme",
    });
  });

  it("fills missing custom colors with the neutral token", () => {
    const colors = createNoteColorTuple([
      "#100000",
      null,
      "#300000",
      null,
      "#500000",
      null,
      "#700000",
      null,
      "#900000",
      null,
      "#b00000",
      null,
    ]);

    expect(
      resolveNoteColors({
        colors,
        mode: "relative",
        name: "Alternating",
        source: "custom",
      }),
    ).toMatchObject({
      colors: createNoteColorTuple([
        "#100000",
        NOTE_COLOR_NEUTRAL_VALUE,
        "#300000",
        NOTE_COLOR_NEUTRAL_VALUE,
        "#500000",
        NOTE_COLOR_NEUTRAL_VALUE,
        "#700000",
        NOTE_COLOR_NEUTRAL_VALUE,
        "#900000",
        NOTE_COLOR_NEUTRAL_VALUE,
        "#b00000",
        NOTE_COLOR_NEUTRAL_VALUE,
      ]),
      mode: "relative",
      source: "custom",
    });
  });

  it("indexes relative colors from the normalized root", () => {
    expect(getNoteColorIndex(61, "D♭", "relative")).toBe(0);
    expect(getNoteColorIndex(64, "D♭", "relative")).toBe(3);
    expect(getNoteColorIndex(61, undefined, "relative")).toBe(1);
  });

  it("returns a normalized CSS variable for an instrument note", () => {
    expect(
      resolveInstrumentNoteColor({ midi: 59, mode: "absolute" }),
    ).toStrictEqual({
      index: 11,
      value: expect.stringMatching(/^var\(--dojo-note-color-11, /),
    });
  });

  it("creates one CSS custom property for every pitch class", () => {
    const colors = createNoteColorTuple(
      Array.from({ length: 12 }, (_, index) => `color-${index}`),
    );

    expect(createNoteColorStyle(colors)).toStrictEqual(
      Object.fromEntries(
        colors.map((color, index) => [`--dojo-note-color-${index}`, color]),
      ),
    );
  });
});
