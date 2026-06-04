"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AudioWaveform, Guitar, Piano, SlidersHorizontal } from "lucide-react";
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
import {
  formatFretboardCreationSummary,
  formatKeyboardCreationSummary,
} from "@/components/instrument-creation/instrumentCreationCopy";
import { DisclosureListPanel } from "@/components/ui/disclosure-list/DisclosureList";
import { CheckOptionButton } from "@/components/ui/buttons/CheckOptionButton";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useAppStore } from "@/stores/appStore";
import {
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationContext,
  type ModuleCreationDefaults,
  type ModuleCreationKind,
} from "@/types/instrument-creation-defaults";
import { type PartModuleCreationRequest } from "@/types/session";
import { DEFAULT_MODULE_CREATION_KINDS } from "@/utils/instrument-creation/moduleCreationDefaults";
import { areRangesEqual } from "@/utils/range/numberRange";
import styles from "./ModuleCreationList.module.css";

export interface ModuleCreationListDraft {
  fretboard?: FretboardModuleCreationDefault;
  keyboard?: KeyboardModuleCreationDefault;
  moduleKinds: ModuleCreationKind[];
  moduleRequests: PartModuleCreationRequest[];
}

interface ModuleCreationListProps {
  context: ModuleCreationContext;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onDraftChange: (draft: ModuleCreationListDraft) => void;
}

const moduleOptions = [
  {
    kind: "fretboard",
    label: "Fretboard",
    previewIcon: <Guitar />,
    subtitle: "String instrument view",
  },
  {
    kind: "keyboard",
    label: "Keyboard",
    previewIcon: <Piano />,
    subtitle: "Piano key view",
  },
  {
    kind: "drone",
    label: "Drone",
    previewIcon: <AudioWaveform />,
    subtitle: "Sustained root tone",
  },
] as const satisfies readonly {
  kind: ModuleCreationKind;
  label: string;
  previewIcon: ReactNode;
  subtitle: string;
}[];

function getInitialModuleKinds(
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
  context: ModuleCreationContext,
) {
  const rememberedKinds =
    context === "session"
      ? moduleCreationDefaults?.sessionModuleKinds
      : moduleCreationDefaults?.partModuleKinds;

  return [...(rememberedKinds ?? DEFAULT_MODULE_CREATION_KINDS)];
}

function ModulePreviewIcon({ children }: { children: ReactNode }) {
  return <span className={styles.modulePreviewIcon}>{children}</span>;
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
  kind,
}: {
  fretboardSelection: FretboardInstrumentSelection;
  keyboardSelection: KeyboardInstrumentSelection;
  kind: ModuleCreationKind;
}): PartModuleCreationRequest {
  switch (kind) {
    case "drone":
      return { type: "drone" };
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
  context,
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
    getInitialModuleKinds(moduleCreationDefaults, context),
  );
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
          fretboardSelection,
          keyboardSelection,
          kind,
        }),
      ),
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
    <div className={styles.moduleList}>
      {moduleOptions.map((option) => {
        const selected = includesKind(moduleKinds, option.kind);
        const isInstrument =
          option.kind === "fretboard" || option.kind === "keyboard";
        const isSettingsOpen = selected && openSettingsKind === option.kind;
        const summary =
          option.kind === "fretboard"
            ? formatFretboardCreationSummary(fretboardSelection)
            : option.kind === "keyboard"
              ? formatKeyboardCreationSummary(keyboardSelection)
              : option.subtitle;

        return (
          <div key={option.kind} className={styles.moduleItem}>
            <div className={styles.moduleRow}>
              <CheckOptionButton
                aria-label={`${selected ? "Remove" : "Add"} ${option.label} module`}
                className={styles.moduleToggle}
                label={option.label}
                selected={selected}
                subtitle={summary}
                onClick={() => toggleModuleKind(option.kind)}
              />
              <ModulePreviewIcon>{option.previewIcon}</ModulePreviewIcon>
              {isInstrument ? (
                <IconButton
                  aria-label={`${option.label} settings`}
                  aria-expanded={isSettingsOpen}
                  disabled={!selected}
                  icon={<SlidersHorizontal />}
                  selected={isSettingsOpen}
                  selectionSemantics="visual"
                  size="md"
                  tooltip={
                    selected
                      ? `${option.label} settings`
                      : `Select ${option.label} to edit settings`
                  }
                  variant="ghost"
                  onClick={() => toggleSettingsKind(option.kind)}
                />
              ) : null}
            </div>
            {isInstrument ? (
              <DisclosureListPanel
                isOpen={isSettingsOpen}
                keepMounted
                variant="menu"
              >
                {option.kind === "fretboard" ? (
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
              </DisclosureListPanel>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
