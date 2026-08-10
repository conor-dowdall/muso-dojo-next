import { describe, expect, it } from "vitest";
import {
  createKeyboardConfig,
  normalizeKeyboardConfig,
} from "@/utils/keyboard/createKeyboardConfig";

describe("createKeyboardConfig", () => {
  it("combines a named range and theme with explicit overrides", () => {
    const config = createKeyboardConfig("keys13", "studio", {
      blackKeyHeightPercent: 70,
      midiRange: [55, 67],
    });

    expect(config).toMatchObject({
      blackKeyHeightPercent: 70,
      midiRange: [55, 67],
      whiteKeyColor:
        "linear-gradient(to bottom, #f7f8f5 0%, #e8ece8 56%, #d5dcd7 100%)",
    });
  });

  it.each([
    [
      [72, 48],
      [48, 72],
    ],
    [
      [-20, 200],
      [0, 127],
    ],
    [
      [60.9, 72.8],
      [60, 72],
    ],
  ] as const)("normalizes MIDI range %j to %j", (input, expected) => {
    expect(
      createKeyboardConfig(undefined, undefined, { midiRange: input }),
    ).toHaveProperty("midiRange", expected);
  });

  it("falls back when a range is malformed or contains no white key", () => {
    expect(
      createKeyboardConfig(undefined, undefined, {
        midiRange: [Number.NaN, 72],
      }).midiRange,
    ).toEqual([48, 72]);
    expect(
      createKeyboardConfig(undefined, undefined, { midiRange: [61, 61] })
        .midiRange,
    ).toEqual([48, 72]);
  });

  it("bounds black-key dimensions to renderable values", () => {
    expect(
      createKeyboardConfig(undefined, undefined, {
        blackKeyHeightPercent: 180,
        blackKeyWidthRatio: 4,
      }),
    ).toMatchObject({
      blackKeyHeightPercent: 100,
      blackKeyWidthRatio: 1,
    });
  });
});

describe("normalizeKeyboardConfig", () => {
  it("omits values supplied by the selected range, theme, and defaults", () => {
    const resolved = createKeyboardConfig("keys13", "studio");

    expect(
      normalizeKeyboardConfig(resolved, "keys13", "studio"),
    ).toBeUndefined();
  });

  it("keeps only meaningful, normalized overrides", () => {
    expect(
      normalizeKeyboardConfig(
        {
          blackKeyHeightPercent: -10,
          blackKeyWidthRatio: 2,
          extendEdgeBlackKeys: false,
          midiRange: [80, 40],
          whiteKeyColor: "  custom-white  ",
        },
        "keys13",
        "classic",
      ),
    ).toEqual({
      blackKeyHeightPercent: 0,
      blackKeyWidthRatio: 1,
      extendEdgeBlackKeys: false,
      midiRange: [40, 80],
      whiteKeyColor: "custom-white",
    });
  });
});
