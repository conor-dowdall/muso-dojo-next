import { describe, expect, it } from "vitest";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import { createFretboardGeometry } from "@/utils/fretboard/createFretboardGeometry";

describe("createFretboardGeometry", () => {
  it("maps every string and fret to a stable key, MIDI note, and grid cell", () => {
    const geometry = createFretboardGeometry(
      createFretboardConfig(undefined, {
        fretRange: [5, 7],
        instrument: "guitar",
        tuning: [60, 64],
        tuningName: "Test tuning",
      }),
    );

    expect(geometry.fretNumbers).toEqual([5, 6, 7]);
    expect(geometry.stringIndices).toEqual([0, 1]);
    expect(geometry.noteCells).toEqual([
      {
        fretIndex: 0,
        fretNumber: 5,
        key: "0-5",
        midi: 65,
        stringIndex: 0,
        style: { gridColumn: "1 / span 1", gridRow: "1 / span 1" },
      },
      {
        fretIndex: 1,
        fretNumber: 6,
        key: "0-6",
        midi: 66,
        stringIndex: 0,
        style: { gridColumn: "2 / span 1", gridRow: "1 / span 1" },
      },
      {
        fretIndex: 2,
        fretNumber: 7,
        key: "0-7",
        midi: 67,
        stringIndex: 0,
        style: { gridColumn: "3 / span 1", gridRow: "1 / span 1" },
      },
      {
        fretIndex: 0,
        fretNumber: 5,
        key: "1-5",
        midi: 69,
        stringIndex: 1,
        style: { gridColumn: "1 / span 1", gridRow: "2 / span 1" },
      },
      {
        fretIndex: 1,
        fretNumber: 6,
        key: "1-6",
        midi: 70,
        stringIndex: 1,
        style: { gridColumn: "2 / span 1", gridRow: "2 / span 1" },
      },
      {
        fretIndex: 2,
        fretNumber: 7,
        key: "1-7",
        midi: 71,
        stringIndex: 1,
        style: { gridColumn: "3 / span 1", gridRow: "2 / span 1" },
      },
    ]);
  });

  it.each([
    [{ fretLabelsPosition: "top", showFretLabels: true }, "2 / -1", "1 / 2"],
    [{ fretLabelsPosition: "bottom", showFretLabels: true }, "1 / 2", "2 / -1"],
    [
      { fretLabelsPosition: "bottom", showFretLabels: false },
      "1 / -1",
      "2 / -1",
    ],
  ] as const)(
    "positions content and labels for %j",
    (overrides, mainContentGridRow, fretLabelsGridRow) => {
      const geometry = createFretboardGeometry(
        createFretboardConfig(undefined, overrides),
      );

      expect(geometry).toMatchObject({
        fretLabelsGridRow,
        mainContentGridRow,
      });
    },
  );

  it("indexes marker and double-marker membership", () => {
    const geometry = createFretboardGeometry(
      createFretboardConfig(undefined, {
        fretInlayDoubles: [12],
        fretLabelDoubles: [12, 24],
        markerFrets: [3, 5, 12],
      }),
    );

    expect(geometry.isMarker(5)).toBe(true);
    expect(geometry.isMarker(6)).toBe(false);
    expect(geometry.isDoubleInlay(12)).toBe(true);
    expect(geometry.isDoubleLabel(24)).toBe(true);
  });
});
