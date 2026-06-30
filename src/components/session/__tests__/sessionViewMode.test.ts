import { describe, expect, it } from "vitest";
import {
  requiresSessionParts,
  sessionViewModes,
} from "@/components/session/sessionViewMode";

describe("session view mode policy", () => {
  it("requires Parts for every non-session view", () => {
    expect(
      sessionViewModes.filter((mode) => requiresSessionParts(mode)),
    ).toEqual(["band", "live-part", "focus"]);
  });
});
