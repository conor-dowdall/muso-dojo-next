import {
  stringInstruments,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET } from "@/data/fretboard/inlayPresets";
import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import { DEFAULT_WOOD_SURFACE_ID } from "@/data/woodSurfaces";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import {
  type DroneModuleCreationDefault,
  type ExerciseLooperModuleCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationContext,
  type ModuleCreationDefaults,
  type ModuleCreationKindDefaults,
  type ModuleCreationKind,
  type RhythmModuleCreationDefault,
} from "@/types/instrument-creation-defaults";
import { DEFAULT_EXERCISE_OCTAVE_OFFSET } from "@/utils/exercise-looper/exerciseConfig";
import { areRangesEqual } from "@/utils/range/numberRange";
import { tuningNotesAreEqual } from "@/utils/fretboard/customFretboardTunings";

export const DEFAULT_MODULE_CREATION_KINDS = [
  "fretboard",
] as const satisfies readonly ModuleCreationKind[];
export const DEFAULT_SESSION_MODULE_CREATION_KINDS =
  DEFAULT_MODULE_CREATION_KINDS;
export const DEFAULT_PART_MODULE_CREATION_KINDS =
  [] as const satisfies readonly ModuleCreationKind[];

const DEFAULT_MODULE_CREATION_KINDS_BY_CONTEXT = {
  part: DEFAULT_PART_MODULE_CREATION_KINDS,
  session: DEFAULT_SESSION_MODULE_CREATION_KINDS,
} as const satisfies Record<
  ModuleCreationContext,
  readonly ModuleCreationKind[]
>;

export function createBuiltInDroneModuleCreationDefault(): DroneModuleCreationDefault {
  return {
    octaveOffset: 0,
    wood: DEFAULT_WOOD_SURFACE_ID,
  };
}

export function createBuiltInExerciseLooperModuleCreationDefault(): ExerciseLooperModuleCreationDefault {
  return {
    octaveOffset: DEFAULT_EXERCISE_OCTAVE_OFFSET,
    wood: DEFAULT_WOOD_SURFACE_ID,
  };
}

export function createBuiltInRhythmModuleCreationDefault(): RhythmModuleCreationDefault {
  return {
    rhythm: DEFAULT_RHYTHM_SELECTION,
    wood: DEFAULT_WOOD_SURFACE_ID,
  };
}

export function createBuiltInFretboardModuleCreationDefault(): FretboardModuleCreationDefault {
  const instrument = "guitar" satisfies StringInstrumentKey;

  return {
    instrument,
    tuningKey: stringInstruments[instrument].defaultTuning,
    handedness: "right",
    appearanceSource: "auto",
    theme: getDefaultFretboardWoodThemeName(instrument),
    inlayPreset: DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  };
}

export function createBuiltInKeyboardModuleCreationDefault(): KeyboardModuleCreationDefault {
  return {
    theme: DEFAULT_KEYBOARD_THEME,
  };
}

export function moduleCreationKindsAreEqual(
  left: readonly ModuleCreationKind[] | undefined,
  right: readonly ModuleCreationKind[] | undefined,
  fallback: readonly ModuleCreationKind[] = DEFAULT_MODULE_CREATION_KINDS,
) {
  const resolvedLeft = left ?? fallback;
  const resolvedRight = right ?? fallback;

  return (
    resolvedLeft.length === resolvedRight.length &&
    resolvedLeft.every((kind, index) => kind === resolvedRight[index])
  );
}

export function getBuiltInModuleCreationKinds(
  context: ModuleCreationContext,
): readonly ModuleCreationKind[] {
  return DEFAULT_MODULE_CREATION_KINDS_BY_CONTEXT[context];
}

export function getModuleCreationKindsForContext(
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
  context: ModuleCreationContext,
): ModuleCreationKind[] {
  return [
    ...(moduleCreationDefaults?.moduleKindDefaults?.[context] ??
      getBuiltInModuleCreationKinds(context)),
  ];
}

function moduleCreationKindDefaultsAreEqual(
  left: ModuleCreationKindDefaults | undefined,
  right: ModuleCreationKindDefaults | undefined,
) {
  return (
    moduleCreationKindsAreEqual(
      left?.session,
      right?.session,
      DEFAULT_SESSION_MODULE_CREATION_KINDS,
    ) &&
    moduleCreationKindsAreEqual(
      left?.part,
      right?.part,
      DEFAULT_PART_MODULE_CREATION_KINDS,
    )
  );
}

function fretboardRangesAreEqual(
  left: FretboardModuleCreationDefault["range"],
  right: FretboardModuleCreationDefault["range"],
) {
  if (!left || !right) {
    return left === right;
  }

  return areRangesEqual(left.fretRange, right.fretRange);
}

export function fretboardModuleCreationDefaultsAreEqual(
  left: FretboardModuleCreationDefault,
  right: FretboardModuleCreationDefault,
) {
  return (
    left.instrument === right.instrument &&
    left.tuningKey === right.tuningKey &&
    left.tuningName === right.tuningName &&
    (left.tuning === undefined && right.tuning === undefined
      ? true
      : tuningNotesAreEqual(left.tuning, right.tuning)) &&
    left.handedness === right.handedness &&
    left.appearanceSource === right.appearanceSource &&
    left.theme === right.theme &&
    left.inlayPreset === right.inlayPreset &&
    fretboardRangesAreEqual(left.range, right.range)
  );
}

function keyboardRangesAreEqual(
  left: KeyboardModuleCreationDefault["range"],
  right: KeyboardModuleCreationDefault["range"],
) {
  if (!left || !right) {
    return left === right;
  }

  if (left.source !== right.source) {
    return false;
  }

  return left.source === "named"
    ? right.source === "named" && left.range === right.range
    : right.source === "custom" &&
        areRangesEqual(left.midiRange, right.midiRange);
}

export function keyboardModuleCreationDefaultsAreEqual(
  left: KeyboardModuleCreationDefault,
  right: KeyboardModuleCreationDefault,
) {
  return (
    left.theme === right.theme &&
    keyboardRangesAreEqual(left.range, right.range)
  );
}

export function droneModuleCreationDefaultsAreEqual(
  left: DroneModuleCreationDefault,
  right: DroneModuleCreationDefault,
) {
  return (
    (left.octaveOffset ?? 0) === (right.octaveOffset ?? 0) &&
    (left.wood ?? DEFAULT_WOOD_SURFACE_ID) ===
      (right.wood ?? DEFAULT_WOOD_SURFACE_ID)
  );
}

export function exerciseLooperModuleCreationDefaultsAreEqual(
  left: ExerciseLooperModuleCreationDefault,
  right: ExerciseLooperModuleCreationDefault,
) {
  return (
    (left.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET) ===
      (right.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET) &&
    (left.wood ?? DEFAULT_WOOD_SURFACE_ID) ===
      (right.wood ?? DEFAULT_WOOD_SURFACE_ID)
  );
}

export function rhythmModuleCreationDefaultsAreEqual(
  left: RhythmModuleCreationDefault,
  right: RhythmModuleCreationDefault,
) {
  return (
    rhythmSelectionsAreEqual(
      left.rhythm ?? DEFAULT_RHYTHM_SELECTION,
      right.rhythm ?? DEFAULT_RHYTHM_SELECTION,
    ) &&
    (left.wood ?? DEFAULT_WOOD_SURFACE_ID) ===
      (right.wood ?? DEFAULT_WOOD_SURFACE_ID)
  );
}

export function rhythmSelectionsAreEqual(
  left: RhythmSelection,
  right: RhythmSelection,
) {
  if (left.source !== right.source) {
    return false;
  }

  const leftRecipe = getRhythmSelectionRecipe(left);
  const rightRecipe = getRhythmSelectionRecipe(right);

  return (
    leftRecipe.beats === rightRecipe.beats &&
    leftRecipe.groove === rightRecipe.groove &&
    leftRecipe.grouping === rightRecipe.grouping &&
    leftRecipe.timekeeper.feel === rightRecipe.timekeeper.feel &&
    leftRecipe.timekeeper.sound === rightRecipe.timekeeper.sound &&
    leftRecipe.timekeeper.subdivision === rightRecipe.timekeeper.subdivision
  );
}

export function moduleCreationDefaultsAreEqual(
  left: ModuleCreationDefaults | undefined,
  right: ModuleCreationDefaults | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  if (
    !moduleCreationKindDefaultsAreEqual(
      left.moduleKindDefaults,
      right.moduleKindDefaults,
    )
  ) {
    return false;
  }

  if (!left.drone || !right.drone) {
    if (left.drone !== right.drone) {
      return false;
    }
  } else if (!droneModuleCreationDefaultsAreEqual(left.drone, right.drone)) {
    return false;
  }

  if (!left.exerciseLooper || !right.exerciseLooper) {
    if (left.exerciseLooper !== right.exerciseLooper) {
      return false;
    }
  } else if (
    !exerciseLooperModuleCreationDefaultsAreEqual(
      left.exerciseLooper,
      right.exerciseLooper,
    )
  ) {
    return false;
  }

  if (!left.rhythm || !right.rhythm) {
    if (left.rhythm !== right.rhythm) {
      return false;
    }
  } else if (!rhythmModuleCreationDefaultsAreEqual(left.rhythm, right.rhythm)) {
    return false;
  }

  if (!left.fretboard || !right.fretboard) {
    if (left.fretboard !== right.fretboard) {
      return false;
    }
  } else if (
    !fretboardModuleCreationDefaultsAreEqual(left.fretboard, right.fretboard)
  ) {
    return false;
  }

  if (!left.keyboard || !right.keyboard) {
    return left.keyboard === right.keyboard;
  }

  return keyboardModuleCreationDefaultsAreEqual(left.keyboard, right.keyboard);
}
