import { describe, expect, it } from "vitest";
import {
  createDefaultArrangementSectionName,
  formatArrangementSectionName,
} from "@/utils/arrangement/arrangementSectionNames";

describe("Arrangement Section names", () => {
  it("formats alphabetic labels beyond Z", () => {
    expect(formatArrangementSectionName(0)).toBe("Section A");
    expect(formatArrangementSectionName(25)).toBe("Section Z");
    expect(formatArrangementSectionName(26)).toBe("Section AA");
  });

  it("creates the next unused default name", () => {
    expect(
      createDefaultArrangementSectionName(["Section A", "Section B"]),
    ).toBe("Section C");
    expect(
      createDefaultArrangementSectionName(["Verse", "Chorus", "Section C"]),
    ).toBe("Section D");
  });
});
