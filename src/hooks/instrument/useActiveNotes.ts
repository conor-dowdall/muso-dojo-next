import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { type SettingValue } from "@/types/state";
import { areActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";

/**
 * Smart controlled/uncontrolled pattern for active notes.
 *
 * `undefined` is meaningful for store-backed instrument views; it means "use the
 * generated notes for the current root, collection, and geometry". Therefore a
 * component is controlled when a change handler exists, even if the stored value
 * is currently undefined.
 *
 * @param externalActiveNotes - Controlled active notes from parent (if any)
 * @param externalOnChange - Controlled change handler from parent (if any)
 * @param dependencies - A string key representing the current musical context
 *   (e.g. `${rootNote}-${scale}-${tuning}`). When this changes, internal state
 *   is recalculated via `recalculate`.
 * @param recalculate - A function that returns generated ActiveNotes for the
 *   current dependencies.
 * @param options.preserveOnDependencyChange - Keep controlled overrides when
 *   dependencies change. Locked instruments use this so root/collection changes
 *   do not erase their stored note map until the instrument is unlocked.
 */
export function useActiveNotes(
  externalActiveNotes: ActiveNotes | undefined,
  externalOnChange: ActiveNotesSetter | undefined,
  dependencies: string,
  recalculate: () => ActiveNotes,
  options: {
    preserveOnDependencyChange?: boolean;
  } = {},
): [ActiveNotes, ActiveNotesSetter, ActiveNotes] {
  const isControlled = externalOnChange !== undefined;
  const { preserveOnDependencyChange = false } = options;
  const initialActiveNotes = recalculate();
  const previousControlledDependencies = useRef(dependencies);
  const hadLockedDependencyChange = useRef(false);
  const [internalState, setInternalState] = useState(() => ({
    dependencies,
    activeNotes: externalActiveNotes ?? initialActiveNotes,
  }));

  const dependenciesChanged = internalState.dependencies !== dependencies;
  let internalActiveNotes = internalState.activeNotes;

  if (!isControlled && dependenciesChanged) {
    internalActiveNotes = externalActiveNotes ?? initialActiveNotes;
    // Guarded derived-state update keeps uncontrolled notes in sync without
    // committing a stale frame or causing an effect-driven cascading render.
    setInternalState({
      dependencies,
      activeNotes: internalActiveNotes,
    });
  }

  const activeNotes = isControlled
    ? (externalActiveNotes ?? initialActiveNotes)
    : internalActiveNotes;

  useLayoutEffect(() => {
    if (!isControlled) {
      previousControlledDependencies.current = dependencies;
      hadLockedDependencyChange.current = false;
      return;
    }

    const dependenciesDidChange =
      previousControlledDependencies.current !== dependencies;

    if (!dependenciesDidChange) {
      if (!preserveOnDependencyChange) {
        const shouldClearPreservedNotes = shouldClearActiveNotesAfterUnlock({
          externalActiveNotes,
          initialActiveNotes,
          hadLockedDependencyChange: hadLockedDependencyChange.current,
        });

        hadLockedDependencyChange.current = false;

        if (shouldClearPreservedNotes) {
          externalOnChange(undefined);
        }
      }

      return;
    }

    previousControlledDependencies.current = dependencies;

    if (preserveOnDependencyChange) {
      hadLockedDependencyChange.current = externalActiveNotes !== undefined;
      return;
    }

    hadLockedDependencyChange.current = false;

    if (externalActiveNotes !== undefined) {
      externalOnChange(undefined);
    }
  }, [
    dependencies,
    externalActiveNotes,
    externalOnChange,
    initialActiveNotes,
    isControlled,
    preserveOnDependencyChange,
  ]);

  const onActiveNotesChange = useCallback<ActiveNotesSetter>(
    (nextNotes) => {
      const resolvedNotes = resolveActiveNotesValue(nextNotes, activeNotes);
      const normalizedNotes =
        resolvedNotes === undefined ||
        areActiveNotesEqual(resolvedNotes, initialActiveNotes)
          ? undefined
          : resolvedNotes;

      if (isControlled) {
        externalOnChange?.(normalizedNotes);
        return;
      }

      setInternalState({
        dependencies,
        activeNotes: resolvedNotes ?? initialActiveNotes,
      });
    },
    [
      activeNotes,
      dependencies,
      externalOnChange,
      initialActiveNotes,
      isControlled,
    ],
  );

  return [activeNotes, onActiveNotesChange, initialActiveNotes];
}

export function shouldClearActiveNotesAfterUnlock({
  externalActiveNotes,
  initialActiveNotes,
  hadLockedDependencyChange,
}: {
  externalActiveNotes: ActiveNotes | undefined;
  initialActiveNotes: ActiveNotes;
  hadLockedDependencyChange: boolean;
}) {
  return (
    externalActiveNotes !== undefined &&
    (hadLockedDependencyChange ||
      areActiveNotesEqual(externalActiveNotes, initialActiveNotes))
  );
}

function resolveActiveNotesValue(
  value: SettingValue<ActiveNotes | undefined>,
  previousValue: ActiveNotes,
) {
  return typeof value === "function"
    ? (value as (prev: ActiveNotes) => ActiveNotes | undefined)(previousValue)
    : value;
}
