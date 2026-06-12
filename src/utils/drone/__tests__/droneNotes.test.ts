import { describe, expect, it } from "vitest";
import {
  MUSICAL_SURFACE_MIDI_MAX,
  MUSICAL_SURFACE_MIDI_MIN,
} from "@/audio/pitch";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_OFFSET,
  resolveDroneNotes,
} from "@/utils/drone/droneNotes";

describe("droneNotes", () => {
  it("starts finite compound voicings at the declared formula", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "major9",
      rootNote: "C",
    });

    expect(droneNotes.rootNote).toBe("C");
    expect(
      droneNotes.notes.map((note) => ({
        interval: note.interval,
        intervalLabel: note.intervalLabel,
        label: note.label,
      })),
    ).toStrictEqual([
      { interval: 0, intervalLabel: "1", label: "C" },
      { interval: 4, intervalLabel: "3", label: "E" },
      { interval: 7, intervalLabel: "5", label: "G" },
      { interval: 11, intervalLabel: "7", label: "B" },
      { interval: 14, intervalLabel: "9", label: "D" },
    ]);
    expect(droneNotes.columnCount).toBe(5);
    expect(
      droneNotes.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toStrictEqual([["1", "3", "5", "7"], ["9"]]);
    expect(
      droneNotes.rows.map((row) => row.map((note) => note.columnIndex)),
    ).toStrictEqual([[0, 2, 3, 4], [1]]);
    expect(droneNotes.maxNoteCount).toBeGreaterThan(5);
    expect(droneNotes.supportsOctaveRangeEditing).toBe(true);
  });

  it("adds and removes the next register root without removing the ninth", () => {
    const expanded = resolveDroneNotes({
      noteCollectionKey: "major9",
      noteCount: 6,
      rootNote: "C",
    });
    const restoredFormula = resolveDroneNotes({
      noteCollectionKey: "major9",
      noteCount: 5,
      rootNote: "C",
    });

    expect(
      expanded.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([
      ["1", "3", "5", "7"],
      ["8", "9"],
    ]);
    expect(
      restoredFormula.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([["1", "3", "5", "7"], ["9"]]);
  });

  it("adds one complete formula register in package order", () => {
    const expanded = resolveDroneNotes({
      noteCollectionKey: "major9",
      noteCount: 10,
      rootNote: "C",
    });

    expect(
      expanded.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([["1", "3", "5", "7"], ["8", "9", "10", "12", "14"], ["16"]]);
  });

  it("preserves legacy row counts for finite compound voicings", () => {
    const expanded = resolveDroneNotes({
      noteCollectionKey: "major9",
      rowCount: 2,
      rootNote: "C",
    });

    expect(expanded.noteCount).toBe(10);
    expect(expanded.notes.map((note) => note.intervalLabel)).toEqual([
      "1",
      "3",
      "5",
      "7",
      "8",
      "9",
      "10",
      "12",
      "14",
      "16",
    ]);
  });

  it("clamps oversized finite ranges to the available physical rows", () => {
    const expanded = resolveDroneNotes({
      noteCollectionKey: "major9",
      noteCount: 48,
      rootNote: "C",
    });

    expect(expanded.noteCount).toBe(expanded.maxNoteCount);
    expect(expanded.rows).toHaveLength(4);
    expect(expanded.notes.at(-1)?.intervalLabel).toBe("28");
  });

  it("adds octave rows with shifted interval labels", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "major",
      rootNote: "C",
      rowCount: 2,
    });

    expect(
      droneNotes.rows.map((row) =>
        row.map((note) => ({
          interval: note.interval,
          intervalLabel: note.intervalLabel,
          label: note.label,
        })),
      ),
    ).toStrictEqual([
      [
        { interval: 0, intervalLabel: "1", label: "C" },
        { interval: 4, intervalLabel: "3", label: "E" },
        { interval: 7, intervalLabel: "5", label: "G" },
      ],
      [
        { interval: 12, intervalLabel: "8", label: "C" },
        { interval: 16, intervalLabel: "10", label: "E" },
        { interval: 19, intervalLabel: "12", label: "G" },
      ],
    ]);
  });

  it("adds individual notes and wraps them onto the next octave row", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "major",
      noteCount: 4,
      rootNote: "C",
    });

    expect(droneNotes.noteCount).toBe(4);
    expect(
      droneNotes.rows.map((row) =>
        row.map((note) => ({
          columnIndex: note.columnIndex,
          interval: note.interval,
        })),
      ),
    ).toStrictEqual([
      [
        { columnIndex: 0, interval: 0 },
        { columnIndex: 1, interval: 4 },
        { columnIndex: 2, interval: 7 },
      ],
      [{ columnIndex: 0, interval: 12 }],
    ]);
  });

  it("limits an individual-note range to four octaves", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "chromatic",
      noteCount: 48,
      octaveOffset: -1,
      rootNote: "C",
    });

    expect(droneNotes.noteCount).toBe(48);
    expect(droneNotes.maxNoteCount).toBe(48);
    expect(droneNotes.rows).toHaveLength(4);
    expect(droneNotes.rows.every((row) => row.length === 12)).toBe(true);
  });

  it("shifts the displayed octave without changing intervals", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "major",
      octaveOffset: 1,
      rootNote: "C",
    });

    expect(
      droneNotes.notes.map((note) => ({
        interval: note.interval,
        midi: note.midi,
      })),
    ).toStrictEqual([
      { interval: 0, midi: 60 },
      { interval: 4, midi: 64 },
      { interval: 7, midi: 67 },
    ]);
  });

  it("offers complete chromatic octaves at the musical surface bounds", () => {
    const lowestOctave = resolveDroneNotes({
      noteCollectionKey: "chromatic",
      octaveOffset: DRONE_MIN_OCTAVE_OFFSET,
      rootNote: "C",
    });
    const highestOctave = resolveDroneNotes({
      noteCollectionKey: "chromatic",
      octaveOffset: DRONE_MAX_OCTAVE_OFFSET,
      rootNote: "C",
    });

    expect(lowestOctave.hasUnplayableNotes).toBe(false);
    expect(lowestOctave.notes.map((note) => note.midi)).toStrictEqual(
      Array.from(
        { length: 12 },
        (_, index) => MUSICAL_SURFACE_MIDI_MIN + index,
      ),
    );
    expect(highestOctave.hasUnplayableNotes).toBe(false);
    expect(highestOctave.notes.map((note) => note.midi)).toStrictEqual(
      Array.from(
        { length: 12 },
        (_, index) => MUSICAL_SURFACE_MIDI_MAX - 11 + index,
      ),
    );
  });

  it("marks added rows outside the musical surface range as unavailable", () => {
    const aboveRange = resolveDroneNotes({
      noteCollectionKey: "chromatic",
      octaveOffset: DRONE_MAX_OCTAVE_OFFSET,
      rootNote: "C",
      rowCount: 2,
    });

    expect(aboveRange.hasUnplayableNotes).toBe(true);
    expect(aboveRange.rows).toHaveLength(1);
    expect(aboveRange.noteCount).toBe(12);
    expect(aboveRange.maxNoteCount).toBe(12);
  });

  it("preserves collection columns when upper notes are unavailable", () => {
    const partialOctave = resolveDroneNotes({
      noteCollectionKey: "chromatic",
      octaveOffset: DRONE_MAX_OCTAVE_OFFSET,
      rootNote: "F",
    });

    expect(partialOctave.columnCount).toBe(12);
    expect(partialOctave.hasUnplayableNotes).toBe(true);
    expect(partialOctave.notes.map((note) => note.columnIndex)).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it("keeps octave range editing for ordinary collections", () => {
    const simpleChord = resolveDroneNotes({
      noteCollectionKey: "major",
      rowCount: 2,
      rootNote: "C",
    });

    expect(simpleChord.notes.map((note) => note.intervalLabel)).toEqual([
      "1",
      "3",
      "5",
      "8",
      "10",
      "12",
    ]);
    expect(simpleChord.supportsOctaveRangeEditing).toBe(true);
  });
});
