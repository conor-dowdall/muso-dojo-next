// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomChordProgressionEditor } from "@/components/music-theory/CustomChordProgressionEditor";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "scheduler");
});

const progression = {
  chords: [
    {
      chordCollectionKey: "major",
      degree: "1",
      durationInBars: 1,
    },
  ],
} as const;

describe("CustomChordProgressionEditor", () => {
  it("saves an editing grid change even when no chord uses its positions", async () => {
    const onSave = vi.fn(() => true);
    const user = userEvent.setup();
    Object.defineProperty(window, "scheduler", {
      configurable: true,
      value: { yield: () => Promise.resolve() },
    });
    render(
      <CustomChordProgressionEditor
        initialEditingGridPositionCount={6}
        initialName="My Changes"
        initialProgression={progression}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole("button", {
      name: "Save progression",
    });
    expect(saveButton.hasAttribute("disabled")).toBe(true);

    await user.click(
      screen.getByRole("button", {
        name: "Editing grid. Current: 6 positions per bar",
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Use an editing grid with 7 positions per bar",
      }),
    );

    await waitFor(() =>
      expect(saveButton.hasAttribute("disabled")).toBe(false),
    );
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith("My Changes", progression, 7);
  });
});
