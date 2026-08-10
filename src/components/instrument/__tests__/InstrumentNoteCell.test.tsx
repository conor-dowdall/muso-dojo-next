// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";

afterEach(cleanup);

const sharedProps = {
  ariaLabel: "Play Middle C",
  handleKeyDown: vi.fn(),
  isFocused: true,
  midi: 60,
  noteKey: "c4",
  setItemRef: vi.fn(),
};

describe("InstrumentNoteCell", () => {
  it("preserves resting emphasis while exposing playback highlight state", () => {
    const { rerender } = render(
      <InstrumentNoteCell
        {...sharedProps}
        isHighlighted
        note={{ midi: 60, emphasis: "small" }}
      />,
    );
    const button = screen.getByRole("button", { name: "Play Middle C" });
    const note = button.querySelector("[data-note-color-index]");

    expect(button.dataset.noteHighlighted).toBe("true");
    expect(note?.getAttribute("data-emphasis")).toBe("small");

    rerender(
      <InstrumentNoteCell
        {...sharedProps}
        note={{ midi: 60, emphasis: "small" }}
      />,
    );

    expect(button.dataset.noteHighlighted).toBeUndefined();
    expect(note?.getAttribute("data-emphasis")).toBe("small");
  });

  it("renders notes outside the collection as hidden but still interactive", () => {
    const onInteract = vi.fn();
    render(<InstrumentNoteCell {...sharedProps} onInteract={onInteract} />);
    const button = screen.getByRole("button", { name: "Play Middle C" });
    const note = button.querySelector<HTMLElement>("[data-note-color-index]");

    expect(note?.dataset.emphasis).toBe("hidden");
    expect(note?.style.visibility).toBe("hidden");

    fireEvent.pointerDown(button, {
      button: 0,
      isPrimary: true,
      pointerType: "mouse",
    });

    expect(onInteract).toHaveBeenCalledWith(
      { key: "c4", midi: 60, pitchClass: 0 },
      { moveFocus: false },
    );
  });

  it("ignores secondary pointer activation", () => {
    const onInteract = vi.fn();
    render(<InstrumentNoteCell {...sharedProps} onInteract={onInteract} />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Play Middle C" }),
      { button: 2, isPrimary: true, pointerType: "mouse" },
    );

    expect(onInteract).not.toHaveBeenCalled();
  });

  it("forwards keyboard activation and exposes toggle semantics", async () => {
    const handleKeyDown = vi.fn();
    const user = userEvent.setup();
    render(
      <InstrumentNoteCell
        {...sharedProps}
        handleKeyDown={handleKeyDown}
        isToggleButton
        note={{ midi: 60 }}
      />,
    );
    const button = screen.getByRole("button", { name: "Play Middle C" });

    expect(button.getAttribute("aria-pressed")).toBe("true");
    await user.click(button);
    await user.keyboard("{Enter}");

    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: "Enter" }),
      "c4",
    );
  });
});
