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
  it("resolves exactly the notes from the part root and collection", () => {
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
    expect(aboveRange.rows[1]).toStrictEqual([]);
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
});
