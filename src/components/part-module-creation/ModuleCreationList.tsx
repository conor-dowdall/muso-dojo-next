"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  getFretboardModuleCreationDefault,
  getInstrumentPartModuleCreationConfig,
  getKeyboardModuleCreationDefault,
  createDefaultInstrumentSelections,
  type FretboardInstrumentSelection,
  type InstrumentCreationRangeContext,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import { FretboardInstrumentCreationPanel } from "@/components/instrument-creation/FretboardInstrumentCreationPanel";
import { KeyboardInstrumentCreationPanel } from "@/components/instrument-creation/KeyboardInstrumentCreationPanel";
import { DroneCreationPanel } from "@/components/drone/DroneCreationPanel";
import { ExerciseLooperCreationPanel } from "@/components/exercise-looper/ExerciseLooperCreationPanel";
import { RhythmCreationPanel } from "@/components/rhythm/RhythmCreationPanel";
import {
  getRecipeWithBeatCountConstraint,
  getRhythmRecipeCreationSummary,
  getRhythmStarterRecipe,
  rhythmRecipesAreEqual,
  type RhythmBeatCountConstraint,
  type RhythmStarterId,
} from "@/components/rhythm/rhythmRecipeControls";
import {
  formatFretboardCreationSummary,
  formatKeyboardCreationSummary,
} from "@/components/instrument-creation/instrumentCreationCopy";
import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";
import { SelectableActionRow } from "@/components/ui/selectable-overflow-row";
import { MODULE_CREATION_OPTIONS } from "@/components/part-module-creation/moduleCreationOptions";
import { useAppStore } from "@/stores/appStore";
import {
  type DroneModuleCreationDefault,
  type ExerciseLooperModuleCreationDefault,
  type ModuleCreationDefaults,
  type ModuleCreationContext,
  type ModuleCreationKind,
  type RhythmModuleCreationDefault,
} from "@/types/instrument-creation-defaults";
import { DEFAULT_WOOD_SURFACE_ID } from "@/data/woodSurfaces";
import { type PartModuleCreationRequest } from "@/types/session";
import { assertNever } from "@/utils/assertNever";
import { getDroneBaseOctave } from "@/utils/drone/droneNotes";
import { DEFAULT_EXERCISE_OCTAVE_OFFSET } from "@/utils/exercise-looper/exerciseConfig";
import { audioPresets, getDefaultAudioPresetId } from "@/audio";
import { formatValueSummary } from "@/utils/valueSummary";
import { PartModuleBandSourceIndicator } from "@/components/part-module/PartModuleBandSource";
import { getExerciseBaseOctave } from "@/utils/exercise-looper/exerciseSequence";
import { getModuleCreationKindsForContext } from "@/utils/instrument-creation/moduleCreationDefaults";
import { areRangesEqual } from "@/utils/range/numberRange";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { type ModuleCreationListDraft } from "./moduleCreationDraft";

export type { ModuleCreationListDraft } from "./moduleCreationDraft";

interface ModuleCreationListProps {
  context: ModuleCreationContext;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onDraftChange: (draft: ModuleCreationListDraft) => void;
  rhythmBeatCountConstraint?: RhythmBeatCountConstraint;
  rhythmPreferredStarterId?: RhythmStarterId;
}

function hasCreationSettings(kind: ModuleCreationKind) {
  return (
    kind === "drone" ||
    kind === "exercise-looper" ||
    kind === "fretboard" ||
    kind === "keyboard" ||
    kind === "rhythm"
  );
}

function getInitialModuleKinds(
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
  context: ModuleCreationContext,
) {
  return getModuleCreationKindsForContext(moduleCreationDefaults, context);
}

function includesKind(
  moduleKinds: readonly ModuleCreationKind[],
  kind: ModuleCreationKind,
) {
  return moduleKinds.includes(kind);
}

function formatCreationOctave(octave: number) {
  return `Octave ${octave}`;
}

function getModuleCreationSummary({
  droneSelection,
  exerciseLooperSelection,
  fretboardSelection,
  keyboardSelection,
  kind,
  rhythmSelection,
}: {
  droneSelection: DroneModuleCreationDefault;
  exerciseLooperSelection: ExerciseLooperModuleCreationDefault;
  fretboardSelection: FretboardInstrumentSelection;
  keyboardSelection: KeyboardInstrumentSelection;
  kind: ModuleCreationKind;
  rhythmSelection: RhythmModuleCreationDefault;
}) {
  switch (kind) {
    case "drone":
      return formatCreationOctave(
        getDroneBaseOctave(droneSelection.octaveOffset ?? 0),
      );
    case "exercise-looper":
      return formatValueSummary([
        audioPresets[
          exerciseLooperSelection.audioPresetId ??
            getDefaultAudioPresetId("exercise")
        ].label,
        formatCreationOctave(
          getExerciseBaseOctave(
            exerciseLooperSelection.octaveOffset ??
              DEFAULT_EXERCISE_OCTAVE_OFFSET,
          ),
        ),
      ]);
    case "fretboard":
      return formatFretboardCreationSummary(fretboardSelection);
    case "keyboard":
      return formatKeyboardCreationSummary(keyboardSelection);
    case "rhythm":
      return getRhythmRecipeCreationSummary(
        getRhythmSelectionRecipe(
          rhythmSelection.rhythm ?? DEFAULT_RHYTHM_SELECTION,
        ),
      );
    default:
      return assertNever(kind, "Unsupported module creation kind");
  }
}

function getModuleCreationRequest({
  fretboardSelection,
  keyboardSelection,
  droneSelection,
  exerciseLooperSelection,
  kind,
  rhythmSelection,
}: {
  droneSelection: DroneModuleCreationDefault;
  exerciseLooperSelection: ExerciseLooperModuleCreationDefault;
  fretboardSelection: FretboardInstrumentSelection;
  keyboardSelection: KeyboardInstrumentSelection;
  kind: ModuleCreationKind;
  rhythmSelection: RhythmModuleCreationDefault;
}): PartModuleCreationRequest {
  switch (kind) {
    case "drone":
      return { type: "drone", settings: droneSelection };
    case "exercise-looper":
      return { type: "exercise-looper", settings: exerciseLooperSelection };
    case "fretboard":
      return {
        type: "instrument",
        settings: getInstrumentPartModuleCreationConfig(
          "fretboard",
          keyboardSelection,
          fretboardSelection,
        ),
      };
    case "keyboard":
      return {
        type: "instrument",
        settings: getInstrumentPartModuleCreationConfig(
          "keyboard",
          keyboardSelection,
          fretboardSelection,
        ),
      };
    case "rhythm":
      return { type: "rhythm", settings: rhythmSelection };
  }
}

function createRhythmSelectionFromRecipe(
  recipe: ReturnType<typeof getRhythmSelectionRecipe>,
): RhythmSelection {
  return {
    recipe,
    source: "recipe",
  };
}

function getRhythmModuleCreationDefault({
  constraint,
  forcePreferredStarter,
  preferredStarterId,
  value,
}: {
  constraint: RhythmBeatCountConstraint | undefined;
  forcePreferredStarter: boolean;
  preferredStarterId: RhythmStarterId | undefined;
  value: RhythmModuleCreationDefault;
}): RhythmModuleCreationDefault {
  const currentRhythm = value.rhythm ?? DEFAULT_RHYTHM_SELECTION;
  const baseRecipe =
    forcePreferredStarter && preferredStarterId
      ? getRhythmStarterRecipe(preferredStarterId)
      : getRhythmSelectionRecipe(currentRhythm);
  const constrainedRecipe = getRecipeWithBeatCountConstraint(
    baseRecipe,
    constraint,
  );
  const currentRecipe = getRhythmSelectionRecipe(currentRhythm);

  if (rhythmRecipesAreEqual(currentRecipe, constrainedRecipe)) {
    return value;
  }

  return {
    ...value,
    rhythm: createRhythmSelectionFromRecipe(constrainedRecipe),
  };
}

export function ModuleCreationList({
  context,
  instrumentCreationRangeContext,
  onDraftChange,
  rhythmBeatCountConstraint,
  rhythmPreferredStarterId,
}: ModuleCreationListProps) {
  const moduleCreationDefaults = useAppStore(
    (state) => state.dojoSettings.moduleCreationDefaults,
  );
  const [initialSelections] = useState(() =>
    createDefaultInstrumentSelections(
      undefined,
      moduleCreationDefaults,
      instrumentCreationRangeContext,
    ),
  );
  const [moduleKinds, setModuleKinds] = useState<ModuleCreationKind[]>(() =>
    getInitialModuleKinds(moduleCreationDefaults, context),
  );
  const [droneSelection, setDroneSelection] =
    useState<DroneModuleCreationDefault>(() => ({
      octaveOffset: moduleCreationDefaults?.drone?.octaveOffset ?? 0,
      wood: moduleCreationDefaults?.drone?.wood ?? DEFAULT_WOOD_SURFACE_ID,
    }));
  const [exerciseLooperSelection, setExerciseLooperSelection] =
    useState<ExerciseLooperModuleCreationDefault>(() => ({
      audioPresetId:
        moduleCreationDefaults?.exerciseLooper?.audioPresetId ??
        getDefaultAudioPresetId("exercise"),
      octaveOffset:
        moduleCreationDefaults?.exerciseLooper?.octaveOffset ??
        DEFAULT_EXERCISE_OCTAVE_OFFSET,
      wood:
        moduleCreationDefaults?.exerciseLooper?.wood ?? DEFAULT_WOOD_SURFACE_ID,
    }));
  const [rhythmSelection, setRhythmSelection] =
    useState<RhythmModuleCreationDefault>(() => ({
      rhythm:
        moduleCreationDefaults?.rhythm?.rhythm ?? DEFAULT_RHYTHM_SELECTION,
      wood: moduleCreationDefaults?.rhythm?.wood ?? DEFAULT_WOOD_SURFACE_ID,
    }));
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(
      initialSelections.fretboardSelection,
    );
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(initialSelections.keyboardSelection);
  const [closeSignal, setCloseSignal] = useState(0);
  const [openSettingsKind, setOpenSettingsKind] =
    useState<ModuleCreationKind | null>(null);
  const [explicitRange, setExplicitRange] = useState({
    fretboard: false,
    keyboard: false,
  });
  const [rhythmWasEdited, setRhythmWasEdited] = useState(false);
  const hasFretboard = includesKind(moduleKinds, "fretboard");
  const hasKeyboard = includesKind(moduleKinds, "keyboard");
  const effectiveRhythmSelection = useMemo(
    () =>
      getRhythmModuleCreationDefault({
        constraint: rhythmBeatCountConstraint,
        forcePreferredStarter:
          !rhythmWasEdited && Boolean(rhythmPreferredStarterId),
        preferredStarterId: rhythmPreferredStarterId,
        value: rhythmSelection,
      }),
    [
      rhythmBeatCountConstraint,
      rhythmPreferredStarterId,
      rhythmSelection,
      rhythmWasEdited,
    ],
  );

  const draft = useMemo<ModuleCreationListDraft>(() => {
    return {
      moduleKinds,
      moduleRequests: moduleKinds.map((kind) =>
        getModuleCreationRequest({
          droneSelection,
          exerciseLooperSelection,
          fretboardSelection,
          keyboardSelection,
          kind,
          rhythmSelection: effectiveRhythmSelection,
        }),
      ),
      ...(includesKind(moduleKinds, "drone") ? { drone: droneSelection } : {}),
      ...(includesKind(moduleKinds, "exercise-looper")
        ? { exerciseLooper: exerciseLooperSelection }
        : {}),
      ...(includesKind(moduleKinds, "rhythm")
        ? { rhythm: effectiveRhythmSelection }
        : {}),
      ...(hasFretboard
        ? {
            fretboard: getFretboardModuleCreationDefault(fretboardSelection, {
              includeRange: explicitRange.fretboard,
            }),
          }
        : {}),
      ...(hasKeyboard
        ? {
            keyboard: getKeyboardModuleCreationDefault(keyboardSelection, {
              includeRange: explicitRange.keyboard,
            }),
          }
        : {}),
    };
  }, [
    droneSelection,
    effectiveRhythmSelection,
    exerciseLooperSelection,
    explicitRange.fretboard,
    explicitRange.keyboard,
    fretboardSelection,
    hasFretboard,
    hasKeyboard,
    keyboardSelection,
    moduleKinds,
  ]);

  useEffect(() => {
    onDraftChange(draft);
  }, [draft, onDraftChange]);

  const toggleModuleKind = (kind: ModuleCreationKind) => {
    setModuleKinds((currentKinds) => {
      if (currentKinds.includes(kind)) {
        setOpenSettingsKind((currentKind) =>
          currentKind === kind ? null : currentKind,
        );
        return currentKinds.filter((currentKind) => currentKind !== kind);
      }

      return [...currentKinds, kind];
    });
    setCloseSignal((currentSignal) => currentSignal + 1);
  };

  const toggleSettingsKind = (kind: ModuleCreationKind) => {
    setOpenSettingsKind((currentKind) => (currentKind === kind ? null : kind));
    setCloseSignal((currentSignal) => currentSignal + 1);
  };

  const handleFretboardSelectionChange = (
    nextSelection: FretboardInstrumentSelection,
  ) => {
    if (
      !areRangesEqual(fretboardSelection.fretRange, nextSelection.fretRange)
    ) {
      setExplicitRange((currentRange) => ({
        ...currentRange,
        fretboard: true,
      }));
    }

    setFretboardSelection(nextSelection);
  };

  const handleKeyboardSelectionChange = (
    nextSelection: KeyboardInstrumentSelection,
  ) => {
    if (
      keyboardSelection.range !== nextSelection.range ||
      !areRangesEqual(keyboardSelection.midiRange, nextSelection.midiRange)
    ) {
      setExplicitRange((currentRange) => ({
        ...currentRange,
        keyboard: true,
      }));
    }

    setKeyboardSelection(nextSelection);
  };

  const handleRhythmSelectionChange = (
    nextSelection: RhythmModuleCreationDefault,
  ) => {
    setRhythmWasEdited(true);
    setRhythmSelection(
      getRhythmModuleCreationDefault({
        constraint: rhythmBeatCountConstraint,
        forcePreferredStarter: false,
        preferredStarterId: rhythmPreferredStarterId,
        value: nextSelection,
      }),
    );
  };

  return (
    <DisclosureList>
      {MODULE_CREATION_OPTIONS.map((option) => {
        const selected = includesKind(moduleKinds, option.kind);
        const isBackingBandSource =
          selected &&
          (option.kind === "exercise-looper" || option.kind === "rhythm");
        const hasSettings = hasCreationSettings(option.kind);
        const isSettingsOpen = selected && openSettingsKind === option.kind;
        const summary = getModuleCreationSummary({
          droneSelection,
          exerciseLooperSelection,
          fretboardSelection,
          keyboardSelection,
          kind: option.kind,
          rhythmSelection: effectiveRhythmSelection,
        });

        return (
          <SelectableActionRow
            key={option.kind}
            actionDisabled={hasSettings ? !selected : undefined}
            actionIcon={hasSettings ? <SlidersHorizontal /> : undefined}
            actionLabel={hasSettings ? `${option.label} settings` : undefined}
            icon={option.icon}
            isActionOpen={isSettingsOpen}
            keepPanelMounted={hasSettings}
            label={
              <>
                {option.label}
                {isBackingBandSource ? <PartModuleBandSourceIndicator /> : null}
              </>
            }
            selected={selected}
            selectedAriaLabel={`Remove ${option.label} module`}
            selectedPreviewKind="included"
            selectedSelectBehavior="enabled"
            selectAriaLabel={`Add ${option.label} module`}
            subtitle={formatValueSummary([
              summary,
              isBackingBandSource ? "Backing Band source" : undefined,
            ])}
            onAction={
              hasSettings ? () => toggleSettingsKind(option.kind) : undefined
            }
            onSelect={() => toggleModuleKind(option.kind)}
          >
            {hasSettings ? (
              <>
                {option.kind === "drone" ? (
                  <DroneCreationPanel
                    closeSignal={closeSignal}
                    value={droneSelection}
                    onChange={setDroneSelection}
                  />
                ) : option.kind === "exercise-looper" ? (
                  <ExerciseLooperCreationPanel
                    closeSignal={closeSignal}
                    value={exerciseLooperSelection}
                    onChange={setExerciseLooperSelection}
                  />
                ) : option.kind === "rhythm" ? (
                  <RhythmCreationPanel
                    beatCountConstraint={rhythmBeatCountConstraint}
                    closeSignal={closeSignal}
                    value={effectiveRhythmSelection}
                    onChange={handleRhythmSelectionChange}
                  />
                ) : option.kind === "fretboard" ? (
                  <FretboardInstrumentCreationPanel
                    closeSignal={closeSignal}
                    value={fretboardSelection}
                    onChange={handleFretboardSelectionChange}
                  />
                ) : (
                  <KeyboardInstrumentCreationPanel
                    closeSignal={closeSignal}
                    value={keyboardSelection}
                    onChange={handleKeyboardSelectionChange}
                  />
                )}
              </>
            ) : undefined}
          </SelectableActionRow>
        );
      })}
    </DisclosureList>
  );
}
