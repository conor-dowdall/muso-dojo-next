import { describe, expect, it } from "vitest";
import { getNextKeyboardKey } from "@/hooks/keyboard/useKeyboardNavigation";

describe("getNextKeyboardKey", () => {
  const midiRange = [48, 72] as const;

  it("moves chromatically and stops at both range boundaries", () => {
    expect(getNextKeyboardKey("60", "left", midiRange)).toBe("59");
    expect(getNextKeyboardKey("60", "right", midiRange)).toBe("61");
    expect(getNextKeyboardKey("48", "left", midiRange)).toBe("48");
    expect(getNextKeyboardKey("72", "right", midiRange)).toBe("72");
  });

  it("keeps vertical navigation on the current key", () => {
    expect(getNextKeyboardKey("60", "up", midiRange)).toBe("60");
    expect(getNextKeyboardKey("60", "down", midiRange)).toBe("60");
  });

  it("recovers malformed and out-of-range focus keys into the active range", () => {
    expect(getNextKeyboardKey("not-a-note", "right", midiRange)).toBe("49");
    expect(getNextKeyboardKey("10", "up", midiRange)).toBe("48");
    expect(getNextKeyboardKey("100", "down", midiRange)).toBe("72");
  });
});
