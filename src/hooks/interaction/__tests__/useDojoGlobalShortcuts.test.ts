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
    focusModeActive: false,
    ...overrides,
  };
}

describe("getDojoGlobalShortcutAction", () => {
  it("stops active audio with Escape", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ audioPlaying: true }),
      ),
    ).toBe("stop-audio");
  });

  it("leaves Escape unclaimed when audio is idle", () => {
    expect(getDojoGlobalShortcutAction(createKeyEvent(), createContext())).toBe(
      undefined,
    );
  });

  it("exits a focus mode with Escape when audio is idle", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ focusModeActive: true }),
      ),
    ).toBe("exit-focus-mode");
  });

  it("stops audio before exiting a focus mode", () => {
    expect(
      getDojoGlobalShortcutAction(
        createKeyEvent(),
        createContext({ audioPlaying: true, focusModeActive: true }),
      ),
    ).toBe("stop-audio");
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
