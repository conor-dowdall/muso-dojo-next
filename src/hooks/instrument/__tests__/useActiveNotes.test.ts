// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  shouldClearActiveNotesAfterUnlock,
  useActiveNotes,
} from "@/hooks/instrument/useActiveNotes";
import { type ActiveNotes } from "@/types/instrument-active-note";

afterEach(cleanup);

describe("shouldClearActiveNotesAfterUnlock", () => {
  it("keeps custom notes when the musical context did not change while locked", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60, emphasis: "small" },
      },
      initialActiveNotes: {
        c4: { midi: 60 },
      },
      hadLockedDependencyChange: false,
    });

    expect(shouldClear).toBe(false);
  });

  it("clears notes when the musical context changed while locked", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      initialActiveNotes: {
        eb4: { midi: 63 },
      },
      hadLockedDependencyChange: true,
    });

    expect(shouldClear).toBe(true);
  });

  it("clears redundant lock snapshots that match the generated notes", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      initialActiveNotes: {
        c4: { midi: 60 },
      },
      hadLockedDependencyChange: false,
    });

    expect(shouldClear).toBe(true);
  });
});

describe("useActiveNotes", () => {
  const cMajorNotes: ActiveNotes = {
    c4: { midi: 60 },
    e4: { midi: 64 },
  };
  const dMajorNotes: ActiveNotes = {
    d4: { midi: 62 },
    "f-sharp4": { midi: 66 },
  };

  it("updates uncontrolled notes and recalculates them with musical dependencies", () => {
    const { rerender, result } = renderHook(
      ({ dependencies, generated }) =>
        useActiveNotes(undefined, undefined, dependencies, () => generated),
      {
        initialProps: {
          dependencies: "C-major",
          generated: cMajorNotes,
        },
      },
    );

    act(() =>
      result.current[1]((notes) => ({
        ...notes,
        "f-sharp4": { midi: 66, emphasis: "small" },
      })),
    );
    expect(result.current[0]["f-sharp4"]).toStrictEqual({
      midi: 66,
      emphasis: "small",
    });

    rerender({ dependencies: "D-major", generated: dMajorNotes });

    expect(result.current[0]).toBe(dMajorNotes);
    expect(result.current[2]).toBe(dMajorNotes);
  });

  it("normalizes controlled notes back to undefined at the generated state", () => {
    const onChange = vi.fn();
    const customNotes: ActiveNotes = {
      ...cMajorNotes,
      "f-sharp4": { midi: 66 },
    };
    const { result } = renderHook(() =>
      useActiveNotes(customNotes, onChange, "C-major", () => cMajorNotes),
    );

    act(() => result.current[1](cMajorNotes));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("clears a controlled override when unlocked after a dependency change", () => {
    const onChange = vi.fn();
    const lockedNotes: ActiveNotes = {
      c4: { midi: 60, emphasis: "small" },
    };
    const { rerender, result } = renderHook(
      ({ dependencies, generated, locked }) =>
        useActiveNotes(lockedNotes, onChange, dependencies, () => generated, {
          preserveOnDependencyChange: locked,
        }),
      {
        initialProps: {
          dependencies: "C-major",
          generated: cMajorNotes,
          locked: true,
        },
      },
    );

    rerender({
      dependencies: "D-major",
      generated: dMajorNotes,
      locked: true,
    });
    expect(result.current[0]).toBe(lockedNotes);
    expect(onChange).not.toHaveBeenCalled();

    rerender({
      dependencies: "D-major",
      generated: dMajorNotes,
      locked: false,
    });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("keeps a custom override when locking did not span a dependency change", () => {
    const onChange = vi.fn();
    const customNotes: ActiveNotes = {
      c4: { midi: 60, emphasis: "small" },
    };
    const { rerender } = renderHook(
      ({ locked }) =>
        useActiveNotes(customNotes, onChange, "C-major", () => cMajorNotes, {
          preserveOnDependencyChange: locked,
        }),
      { initialProps: { locked: true } },
    );

    rerender({ locked: false });

    expect(onChange).not.toHaveBeenCalled();
  });
});
