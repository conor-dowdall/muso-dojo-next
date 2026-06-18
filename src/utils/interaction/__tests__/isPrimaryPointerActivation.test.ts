import { describe, expect, it } from "vitest";
import {
  isInstrumentNotePointerActivation,
  isPrimaryPointerActivation,
} from "@/utils/interaction/isPrimaryPointerActivation";

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

describe("isInstrumentNotePointerActivation", () => {
  it("keeps primary mouse-style activation rules", () => {
    expect(
      isInstrumentNotePointerActivation({
        button: 0,
        isPrimary: true,
        pointerType: "mouse",
      }),
    ).toBe(true);
    expect(
      isInstrumentNotePointerActivation({
        button: 2,
        isPrimary: true,
        pointerType: "mouse",
      }),
    ).toBe(false);
    expect(
      isInstrumentNotePointerActivation({
        button: 0,
        isPrimary: false,
        pointerType: "mouse",
      }),
    ).toBe(false);
  });

  it("allows additional touch pointers so touch chords can be played", () => {
    expect(
      isInstrumentNotePointerActivation({
        button: 0,
        isPrimary: false,
        pointerType: "touch",
      }),
    ).toBe(true);
  });
});
