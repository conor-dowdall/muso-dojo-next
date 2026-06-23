import { describe, expect, it } from "vitest";
import { shouldHandleScopedTransportShortcut } from "@/hooks/interaction/useScopedTransportShortcuts";

function createKeyEvent(
  overrides: Partial<
    Parameters<typeof shouldHandleScopedTransportShortcut>[0]
  > = {},
): Parameters<typeof shouldHandleScopedTransportShortcut>[0] {
  return {
    altKey: false,
    code: "Space",
    ctrlKey: false,
    defaultPrevented: false,
    key: " ",
    metaKey: false,
    preventDefault: () => undefined,
    shiftKey: false,
    stopPropagation: () => undefined,
    target: null,
    ...overrides,
  };
}

describe("shouldHandleScopedTransportShortcut", () => {
  it("handles unmodified Space only while the transport is active", () => {
    expect(shouldHandleScopedTransportShortcut(createKeyEvent(), true)).toBe(
      true,
    );
    expect(shouldHandleScopedTransportShortcut(createKeyEvent(), false)).toBe(
      false,
    );
  });

  it("ignores non-space and modified shortcuts", () => {
    expect(
      shouldHandleScopedTransportShortcut(
        createKeyEvent({ code: "KeyK", key: "k" }),
        true,
      ),
    ).toBe(false);
    expect(
      shouldHandleScopedTransportShortcut(
        createKeyEvent({ metaKey: true }),
        true,
      ),
    ).toBe(false);
    expect(
      shouldHandleScopedTransportShortcut(
        createKeyEvent({ shiftKey: true }),
        true,
      ),
    ).toBe(false);
  });

  it("ignores events that were already handled", () => {
    expect(
      shouldHandleScopedTransportShortcut(
        createKeyEvent({ defaultPrevented: true }),
        true,
      ),
    ).toBe(false);
  });
});
