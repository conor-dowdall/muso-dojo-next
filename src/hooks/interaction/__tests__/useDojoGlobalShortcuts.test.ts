import { describe, expect, it } from "vitest";
import { getDojoGlobalShortcutAction } from "@/hooks/interaction/useDojoGlobalShortcuts";

function createKeyEvent(
  overrides: Partial<Parameters<typeof getDojoGlobalShortcutAction>[0]> = {},
): Parameters<typeof getDojoGlobalShortcutAction>[0] {
  return {
    altKey: false,
    code: "Escape",
    ctrlKey: false,
    defaultPrevented: false,
    key: "Escape",
    metaKey: false,
    repeat: false,
    shiftKey: false,
    target: null,
    ...overrides,
  };
}

function createContext(
  overrides: Partial<Parameters<typeof getDojoGlobalShortcutAction>[1]> = {},
): Parameters<typeof getDojoGlobalShortcutAction>[1] {
  return {
    audioPlaying: false,
    canTogglePracticeBand: true,
    dialogOpen: false,
    viewMode: "session",
    ...overrides,
  };
}

describe("getDojoGlobalShortcutAction", () => {
  it("prioritizes stopping audio over exiting a view", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ audioPlaying: true, viewMode: "band" }),
      ),
    ).toBe("stop-audio");
  });

  it("exits practice views with Escape when audio is idle", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ viewMode: "live-part" }),
      ),
    ).toBe("exit-view");
  });

  it("does nothing for Escape in the default session view when audio is idle", () => {
    expect(getDojoGlobalShortcutAction(createKeyEvent(), createContext())).toBe(
      undefined,
    );
  });

  it("toggles the Practice Band with Shift+Space", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent({ code: "Space", key: " ", shiftKey: true }),
        createContext(),
      ),
    ).toBe("toggle-practice-band");
  });

  it("leaves plain Space to focused controls and scoped transports", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent({ code: "Space", key: " " }),
        createContext(),
      ),
    ).toBe(undefined);
  });

  it("ignores repeat Shift+Space events so the band does not chatter", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent({
          code: "Space",
          key: " ",
          repeat: true,
          shiftKey: true,
        }),
        createContext(),
      ),
    ).toBe(undefined);
  });

  it("lets dialogs and native edited controls own their shortcuts", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ audioPlaying: true, dialogOpen: true }),
      ),
    ).toBe(undefined);

    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent({ defaultPrevented: true }),
        createContext({ audioPlaying: true }),
      ),
    ).toBe(undefined);
  });
});
