import { describe, expect, it } from "vitest";
import {
  MUSICAL_SURFACE_MIDI_MAX,
  MUSICAL_SURFACE_MIDI_MIN,
  isMusicalSurfaceMidiNote,
  isPlayableMidiNote,
} from "@/audio/pitch";

describe("pitch", () => {
  it("keeps raw MIDI validity separate from the musical surface range", () => {
    expect(MUSICAL_SURFACE_MIDI_MIN).toBe(24);
    expect(MUSICAL_SURFACE_MIDI_MAX).toBe(107);
    expect(isPlayableMidiNote(0)).toBe(true);
    expect(isPlayableMidiNote(127)).toBe(true);

    expect(isMusicalSurfaceMidiNote(MUSICAL_SURFACE_MIDI_MIN - 1)).toBe(false);
    expect(isMusicalSurfaceMidiNote(MUSICAL_SURFACE_MIDI_MIN)).toBe(true);
    expect(isMusicalSurfaceMidiNote(MUSICAL_SURFACE_MIDI_MAX)).toBe(true);
    expect(isMusicalSurfaceMidiNote(MUSICAL_SURFACE_MIDI_MAX + 1)).toBe(false);
  });
});
