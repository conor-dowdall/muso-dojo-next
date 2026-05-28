import { describe, expect, it } from "vitest";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";

describe("normalizeMusicPartConfig", () => {
  it("ignores old persisted layout values", () => {
    const part = normalizeMusicPartConfig({
      id: "part-1",
      rootNote: "C",
      noteCollectionKey: "major",
      layout: "row",
      modules: [],
    });

    expect(part).not.toHaveProperty("layout");
  });
});
