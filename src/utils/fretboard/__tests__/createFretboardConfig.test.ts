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
});
