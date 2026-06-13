import { describe, expect, it } from "vitest";
import { isPrimaryPointerActivation } from "@/utils/interaction/isPrimaryPointerActivation";

describe("isPrimaryPointerActivation", () => {
  it("accepts only the primary pointer's main button", () => {
    expect(isPrimaryPointerActivation({ button: 0, isPrimary: true })).toBe(
      true,
    );
    expect(isPrimaryPointerActivation({ button: 2, isPrimary: true })).toBe(
      false,
    );
    expect(isPrimaryPointerActivation({ button: 0, isPrimary: false })).toBe(
      false,
    );
  });
});
