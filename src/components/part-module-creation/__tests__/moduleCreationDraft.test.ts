import { describe, expect, it } from "vitest";
import { createRememberModuleCreationRequest } from "@/components/part-module-creation/moduleCreationDraft";

describe("createRememberModuleCreationRequest", () => {
  it("keeps every selected module creation default", () => {
    expect(
      createRememberModuleCreationRequest({
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
        moduleRequests: [],
      }),
    ).toStrictEqual({
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
    });
  });
});
