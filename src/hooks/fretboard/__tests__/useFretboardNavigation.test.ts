import { describe, expect, it } from "vitest";
import { getNextFretboardKey } from "@/hooks/fretboard/useFretboardNavigation";

function navigate(
  currentKey: string,
  direction: "up" | "down" | "left" | "right",
  overrides: Partial<{
    fretRange: readonly [number, number];
    leftHanded: boolean;
    stringCount: number;
  }> = {},
) {
  return getNextFretboardKey({
    currentKey,
    direction,
    fretRange: overrides.fretRange ?? [0, 12],
    leftHanded: overrides.leftHanded,
    stringCount: overrides.stringCount ?? 6,
  });
}

describe("getNextFretboardKey", () => {
  it("moves between strings and frets", () => {
    expect(navigate("2-5", "up")).toBe("1-5");
    expect(navigate("2-5", "down")).toBe("3-5");
    expect(navigate("2-5", "left")).toBe("2-4");
    expect(navigate("2-5", "right")).toBe("2-6");
  });

  it("stops at every edge of the rendered fretboard", () => {
    expect(navigate("0-5", "up")).toBe("0-5");
    expect(navigate("5-5", "down")).toBe("5-5");
    expect(navigate("2-0", "left")).toBe("2-0");
    expect(navigate("2-12", "right")).toBe("2-12");
  });

  it("reverses horizontal movement for a left-handed fretboard", () => {
    expect(navigate("2-5", "left", { leftHanded: true })).toBe("2-6");
    expect(navigate("2-5", "right", { leftHanded: true })).toBe("2-4");
  });

  it("recovers invalid focus keys after topology changes", () => {
    expect(
      navigate("bad-key", "right", {
        fretRange: [5, 9],
        stringCount: 4,
      }),
    ).toBe("0-6");
    expect(navigate("8-20", "up", { fretRange: [5, 9], stringCount: 4 })).toBe(
      "2-9",
    );
  });
});
