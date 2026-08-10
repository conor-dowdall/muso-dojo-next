// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInstrumentPresentation } from "@/hooks/instrument/useInstrumentPresentation";

afterEach(cleanup);

describe("useInstrumentPresentation", () => {
  it("manages uncontrolled presentation choices and note resets", () => {
    const { result } = renderHook(() =>
      useInstrumentPresentation({
        initialDisplayFormatId: "midi",
        initialNoteEmphasis: "small",
        initialNoteInteractionMode: "edit-one",
      }),
    );

    expect(result.current).toMatchObject({
      activeDisplayFormatId: "midi",
      emphasisResetKey: 0,
      isModified: false,
      noteEmphasis: "small",
      noteInteractionMode: "edit-one",
    });

    act(() => {
      result.current.setActiveDisplayFormatId("none");
      result.current.setNoteEmphasis("hidden");
      result.current.setNoteInteractionMode("edit-pitch-class");
      result.current.setIsModified(true);
      result.current.resetNotes();
      result.current.resetNotes();
    });

    expect(result.current).toMatchObject({
      activeDisplayFormatId: "none",
      emphasisResetKey: 2,
      isModified: true,
      noteEmphasis: "hidden",
      noteInteractionMode: "edit-pitch-class",
    });
  });

  it("reports controlled changes without replacing controlled values", () => {
    const onDisplayFormatIdChange = vi.fn();
    const onNoteEmphasisChange = vi.fn();
    const onNoteInteractionModeChange = vi.fn();
    const { result } = renderHook(() =>
      useInstrumentPresentation({
        displayFormatId: "note-names",
        noteEmphasis: "large",
        noteInteractionMode: "play",
        onDisplayFormatIdChange,
        onNoteEmphasisChange,
        onNoteInteractionModeChange,
      }),
    );

    act(() => {
      result.current.setActiveDisplayFormatId("midi");
      result.current.setNoteEmphasis("small");
      result.current.setNoteInteractionMode("edit-one");
    });

    expect(onDisplayFormatIdChange).toHaveBeenCalledWith("midi");
    expect(onNoteEmphasisChange).toHaveBeenCalledWith("small");
    expect(onNoteInteractionModeChange).toHaveBeenCalledWith("edit-one");
    expect(result.current).toMatchObject({
      activeDisplayFormatId: "note-names",
      noteEmphasis: "large",
      noteInteractionMode: "play",
    });
  });

  it("keeps the latest lock snapshot and source key outside render state", () => {
    const { result } = renderHook(() => useInstrumentPresentation());
    const snapshot = {
      activeNotes: {
        c4: { emphasis: "small" as const, midi: 60 },
      },
      sourceKey: "C-major-keyboard",
    };

    expect(result.current.getActiveNotesLockSnapshot()).toBeNull();
    expect(result.current.getActiveNotesSourceKey()).toBeNull();

    act(() => {
      result.current.setActiveNotesLockSnapshot(snapshot);
      result.current.setActiveNotesSourceKey("D-major-fretboard");
    });

    expect(result.current.getActiveNotesLockSnapshot()).toBe(snapshot);
    expect(result.current.getActiveNotesSourceKey()).toBe("D-major-fretboard");
  });
});
