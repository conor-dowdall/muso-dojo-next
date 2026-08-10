import { describe, expect, it } from "vitest";
import { createKeyboardConfig } from "@/utils/keyboard/createKeyboardConfig";
import { createKeyboardGeometry } from "@/utils/keyboard/createKeyboardGeometry";

describe("createKeyboardGeometry", () => {
  it("creates ordered, unique, interactive cells including an adjacent edge sharp", () => {
    const geometry = createKeyboardGeometry(
      createKeyboardConfig(undefined, undefined, {
        midiRange: [60, 72],
        extendEdgeBlackKeys: true,
      }),
    );

    expect(geometry.interactiveMidiRange).toEqual([60, 73]);
    expect(geometry.noteCells.map(({ midi }) => midi)).toEqual(
      Array.from({ length: 14 }, (_, index) => 60 + index),
    );
    expect(new Set(geometry.noteCells.map(({ key }) => key)).size).toBe(14);
    expect(geometry.whiteKeys).toHaveLength(8);
    expect(geometry.blackKeys).toHaveLength(6);
  });

  it("assigns stable key geometry and stacking by key color", () => {
    const geometry = createKeyboardGeometry(
      createKeyboardConfig(undefined, undefined, {
        blackKeyHeightPercent: 60,
        blackKeyWidthRatio: 0.5,
        extendEdgeBlackKeys: false,
        midiRange: [60, 64],
      }),
    );
    const c = geometry.noteCells.find(({ midi }) => midi === 60);
    const cSharp = geometry.noteCells.find(({ midi }) => midi === 61);

    expect(c).toMatchObject({
      height: "100%",
      isBlack: false,
      key: "60",
      left: "0%",
      midi: 60,
      style: { zIndex: 1 },
    });
    expect(cSharp).toMatchObject({
      height: "60%",
      isBlack: true,
      key: "61",
      midi: 61,
      style: { zIndex: 2 },
    });
    expect(Number.parseFloat(cSharp?.width ?? "NaN")).toBeCloseTo(
      Number.parseFloat(geometry.whiteKeyWidth) * 0.5,
    );
  });
});
