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
  type ModuleCreationKind,
} from "@/types/instrument-creation-defaults";
import { DEFAULT_WOOD_SURFACE_ID, woodSurfaces } from "@/data/woodSurfaces";
import { type PartModuleCreationRequest } from "@/types/session";
import { DEFAULT_MODULE_CREATION_KINDS } from "@/utils/instrument-creation/moduleCreationDefaults";
import { areRangesEqual } from "@/utils/range/numberRange";
import { type ModuleCreationListDraft } from "./moduleCreationDraft";

export type { ModuleCreationListDraft } from "./moduleCreationDraft";

interface ModuleCreationListProps {
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onDraftChange: (draft: ModuleCreationListDraft) => void;
}

function hasCreationSettings(kind: ModuleCreationKind) {
  return (
    kind === "drone" ||
    kind === "exercise-looper" ||
    kind === "fretboard" ||
    kind === "keyboard"
  );
}

function getInitialModuleKinds(
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
) {
  return [
    ...(moduleCreationDefaults?.moduleKinds ?? DEFAULT_MODULE_CREATION_KINDS),
  ];
}

function includesKind(
  moduleKinds: readonly ModuleCreationKind[],
  kind: ModuleCreationKind,
) {
  return moduleKinds.includes(kind);
}

function getModuleCreationRequest({
  fretboardSelection,
  keyboardSelection,
  droneSelection,
  exerciseLooperSelection,
  kind,
}: {
  droneSelection: DroneModuleCreationDefault;
  exerciseLooperSelection: ExerciseLooperModuleCreationDefault;
  fretboardSelection: FretboardInstrumentSelection;
  keyboardSelection: KeyboardInstrumentSelection;
  kind: ModuleCreationKind;
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
  }
}

export function ModuleCreationList({
  instrumentCreationRangeContext,
  onDraftChange,
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
    getInitialModuleKinds(moduleCreationDefaults),
  );
  const [droneSelection, setDroneSelection] =
    useState<DroneModuleCreationDefault>(() => ({
      wood: moduleCreationDefaults?.drone?.wood ?? DEFAULT_WOOD_SURFACE_ID,
    }));
  const [exerciseLooperSelection, setExerciseLooperSelection] =
    useState<ExerciseLooperModuleCreationDefault>(() => ({
      wood:
        moduleCreationDefaults?.exerciseLooper?.wood ?? DEFAULT_WOOD_SURFACE_ID,
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
  const hasFretboard = includesKind(moduleKinds, "fretboard");
  const hasKeyboard = includesKind(moduleKinds, "keyboard");

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
        }),
      ),
      ...(includesKind(moduleKinds, "drone") ? { drone: droneSelection } : {}),
      ...(includesKind(moduleKinds, "exercise-looper")
        ? { exerciseLooper: exerciseLooperSelection }
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

  return (
    <DisclosureList>
      {MODULE_CREATION_OPTIONS.map((option) => {
        const selected = includesKind(moduleKinds, option.kind);
        const hasSettings = hasCreationSettings(option.kind);
        const isSettingsOpen = selected && openSettingsKind === option.kind;
        const summary =
          option.kind === "drone"
            ? woodSurfaces[droneSelection.wood ?? DEFAULT_WOOD_SURFACE_ID].title
            : option.kind === "exercise-looper"
              ? woodSurfaces[
                  exerciseLooperSelection.wood ?? DEFAULT_WOOD_SURFACE_ID
                ].title
              : option.kind === "fretboard"
                ? formatFretboardCreationSummary(fretboardSelection)
                : formatKeyboardCreationSummary(keyboardSelection);

        return (
          <SelectableActionRow
            key={option.kind}
            actionDisabled={hasSettings ? !selected : undefined}
            actionIcon={hasSettings ? <SlidersHorizontal /> : undefined}
            actionLabel={hasSettings ? `${option.label} settings` : undefined}
            icon={option.icon}
            isActionOpen={isSettingsOpen}
            keepPanelMounted={hasSettings}
            label={option.label}
            selected={selected}
            selectedAriaLabel={`Remove ${option.label} module`}
            selectedPreviewKind="included"
            selectedSelectBehavior="enabled"
            selectAriaLabel={`Add ${option.label} module`}
            subtitle={summary}
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
                  <DroneCreationPanel
                    ariaLabel="Looper settings"
                    closeSignal={closeSignal}
                    value={exerciseLooperSelection}
                    onChange={setExerciseLooperSelection}
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
