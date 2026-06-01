import { describe, expect, it } from "vitest";
import {
  getDefaultInstrumentAudioPresetId,
  normalizeInstrumentAudioPresetId,
  resolveInstrumentAudioPresetId,
} from "@/utils/instrument/resolveInstrumentAudioPreset";

describe("resolveInstrumentAudioPreset", () => {
  it("uses broad defaults when no concrete instrument context is available", () => {
    expect(getDefaultInstrumentAudioPresetId("keyboard")).toBe("piano");
    expect(getDefaultInstrumentAudioPresetId("fretboard")).toBe("steel-string");
  });

  it("uses concrete fretboard instruments to choose a better default", () => {
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "guitar",
      }),
    ).toBe("steel-string");
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "bassGuitar",
      }),
    ).toBe("picked-bass");
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "mandolin",
      }),
    ).toBe("mandolin");
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "ukulele",
      }),
    ).toBe("nylon-string");
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "violin",
      }),
    ).toBe("bowed-strings");
    expect(
      resolveInstrumentAudioPresetId("fretboard", undefined, {
        fretboardInstrument: "doubleBass",
      }),
    ).toBe("bowed-strings");
  });

  it("normalizes concrete instrument defaults out of persisted config", () => {
    expect(
      normalizeInstrumentAudioPresetId("fretboard", "picked-bass", {
        fretboardInstrument: "bassGuitar",
      }),
    ).toBeUndefined();
    expect(
      normalizeInstrumentAudioPresetId("fretboard", "distortion-guitar", {
        fretboardInstrument: "guitar",
      }),
    ).toBe("distortion-guitar");
  });
});
