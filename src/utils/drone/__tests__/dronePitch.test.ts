import { describe, expect, it } from "vitest";
import {
  normalizeDroneOctave,
  resolveDronePitch,
} from "@/utils/drone/dronePitch";

describe("dronePitch", () => {
  it("resolves a root note and octave to a MIDI note", () => {
    expect(resolveDronePitch({ rootNote: "C", octave: 3 })).toStrictEqual({
      label: "C3",
      midi: 48,
      octave: 3,
      rootNote: "C",
    });
  });

  it("keeps the normalized root spelling in the label", () => {
    expect(resolveDronePitch({ rootNote: "Db", octave: 3 })).toMatchObject({
      label: "D♭3",
      midi: 49,
      rootNote: "D♭",
    });
  });

  it("clamps octave to the supported drone range", () => {
    expect(normalizeDroneOctave(1)).toBe(2);
    expect(normalizeDroneOctave(8)).toBe(5);
    expect(normalizeDroneOctave(undefined)).toBe(3);
  });
});
