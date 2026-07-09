import { describe, expect, it } from "vitest";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";

describe("createFretboardConfig", () => {
  it("applies an explicit inlay preset after stored visual overrides", () => {
    const config = createFretboardConfig(
      "maple",
      {
        fretInlayImage: "paw-print",
        showFretInlays: true,
      },
      "none",
    );

    expect(config.showFretInlays).toBe(false);
  });

  it("keeps custom visual overrides when the inlay preset is auto", () => {
    const config = createFretboardConfig(
      "maple",
      {
        fretInlayImage: "paw-print",
        showFretInlays: true,
      },
      "auto",
    );

    expect(config).toMatchObject({
      fretInlayImage: "paw-print",
      showFretInlays: true,
    });
  });

  it("bounds malformed fret ranges to the supported rendering range", () => {
    expect(
      createFretboardConfig("maple", {
        fretRange: [-100, 1_000_000],
      }).fretRange,
    ).toEqual([0, 24]);
    expect(
      createFretboardConfig("maple", {
        fretRange: [30.9, 12.8],
      }).fretRange,
    ).toEqual([12, 24]);
  });

  it("preserves a named custom tuning snapshot", () => {
    const config = createFretboardConfig(undefined, {
      instrument: "ukulele",
      tuning: [69, 64, 60, 67],
      tuningName: "Low G",
    });

    expect(config).toMatchObject({
      instrument: "ukulele",
      tuning: [69, 64, 60, 67],
      tuningName: "Low G",
    });
    expect(config.tuningKey).toBeUndefined();
  });
});
