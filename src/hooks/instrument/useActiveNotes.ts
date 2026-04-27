import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { type SettingValue } from "@/types/state";
import { areActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";

/**
 * Smart controlled/uncontrolled pattern for active notes.
 *
 * `undefined` is meaningful for store-backed instruments: it means "use the
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
 */
export function useActiveNotes(
  externalActiveNotes: ActiveNotes | undefined,
  externalOnChange: ActiveNotesSetter | undefined,
  dependencies: string,
  recalculate: () => ActiveNotes,
): [ActiveNotes, ActiveNotesSetter, ActiveNotes] {
  const isControlled = externalOnChange !== undefined;
  const initialActiveNotes = recalculate();
  const previousControlledDependencies = useRef(dependencies);
  const [internalState, setInternalState] = useState(() => ({
    dependencies,
    activeNotes: externalActiveNotes ?? initialActiveNotes,
  }));

  const dependenciesChanged = internalState.dependencies !== dependencies;
  let internalActiveNotes = internalState.activeNotes;

  if (!isControlled && dependenciesChanged) {
    internalActiveNotes = externalActiveNotes ?? initialActiveNotes;
    setInternalState({
      dependencies,
      activeNotes: internalActiveNotes,
    });
  }

  const activeNotes = isControlled
    ? (externalActiveNotes ?? initialActiveNotes)
    : internalActiveNotes;

  useEffect(() => {
    if (!isControlled) {
      previousControlledDependencies.current = dependencies;
      return;
    }

    if (previousControlledDependencies.current === dependencies) {
      return;
    }

    previousControlledDependencies.current = dependencies;

    if (externalActiveNotes !== undefined) {
      externalOnChange(undefined);
    }
  }, [dependencies, externalActiveNotes, externalOnChange, isControlled]);

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

function resolveActiveNotesValue(
  value: SettingValue<ActiveNotes | undefined>,
  previousValue: ActiveNotes,
) {
  return typeof value === "function"
    ? (value as (prev: ActiveNotes) => ActiveNotes | undefined)(previousValue)
    : value;
}
