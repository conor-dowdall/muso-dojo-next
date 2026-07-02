import { describe, expect, it } from "vitest";
import {
  isPracticeSessionViewMode,
  requiresSessionParts,
  sessionViewModes,
  showsOnlyLivePart,
  showsSessionChart,
  usesReadOnlyPartChrome,
} from "@/components/session/sessionViewMode";

describe("session view mode policy", () => {
  it("requires Parts for every non-session view", () => {
    expect(
      sessionViewModes.filter((mode) => requiresSessionParts(mode)),
    ).toEqual(["chart", "live", "clean"]);
  });

  it("keeps view-mode presentation policy explicit", () => {
    expect(
      sessionViewModes.filter((mode) => isPracticeSessionViewMode(mode)),
    ).toEqual(["chart", "live", "clean"]);
    expect(sessionViewModes.filter((mode) => showsSessionChart(mode))).toEqual([
      "chart",
    ]);
    expect(sessionViewModes.filter((mode) => showsOnlyLivePart(mode))).toEqual([
      "live",
    ]);
    expect(
      sessionViewModes.filter((mode) => usesReadOnlyPartChrome(mode)),
    ).toEqual(["live", "clean"]);
  });
});
