import { describe, expect, it } from "vitest";
import { createRememberModuleCreationRequest } from "@/components/part-module-creation/moduleCreationDraft";

describe("createRememberModuleCreationRequest", () => {
  it("remembers every selected module and its available settings", () => {
    expect(
      createRememberModuleCreationRequest(
        {
          drone: { wood: "ebony" },
          exerciseLooper: { wood: "maple" },
          fretboard: {
            appearanceSource: "custom",
            handedness: "right",
            inlayPreset: "dots",
            instrument: "guitar",
            theme: "maple",
            tuningKey: "guitarStandardE",
          },
          keyboard: { theme: "studio" },
          rhythm: { wood: "ebony" },
          moduleKinds: [
            "drone",
            "exercise-looper",
            "fretboard",
            "keyboard",
            "rhythm",
          ],
          moduleRequests: [],
        },
        "part",
      ),
    ).toStrictEqual({
      context: "part",
      drone: { wood: "ebony" },
      exerciseLooper: { wood: "maple" },
      fretboard: {
        appearanceSource: "custom",
        handedness: "right",
        inlayPreset: "dots",
        instrument: "guitar",
        theme: "maple",
        tuningKey: "guitarStandardE",
      },
      keyboard: { theme: "studio" },
      moduleKinds: [
        "drone",
        "exercise-looper",
        "fretboard",
        "keyboard",
        "rhythm",
      ],
      rhythm: { wood: "ebony" },
    });
  });
});
