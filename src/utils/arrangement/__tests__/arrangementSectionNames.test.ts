import { describe, expect, it } from "vitest";
import {
  createDefaultArrangementSectionName,
  formatArrangementSectionName,
} from "@/utils/arrangement/arrangementSectionNames";

describe("Arrangement Section names", () => {
  it("formats alphabetic labels beyond Z", () => {
    expect(formatArrangementSectionName(0)).toBe("A");
    expect(formatArrangementSectionName(25)).toBe("Z");
    expect(formatArrangementSectionName(26)).toBe("AA");
  });

  it("creates the next unused default name", () => {
    expect(createDefaultArrangementSectionName(["A", "B"])).toBe("C");
    expect(createDefaultArrangementSectionName(["A", "B", "C"])).toBe("D");
  });
});
