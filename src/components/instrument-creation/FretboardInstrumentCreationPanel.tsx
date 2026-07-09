"use client";

import { useEffect, useState } from "react";
import {
  stringInstrumentTunings,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListChoiceItem,
  DisclosureListGroup,
  DisclosureListItem,
  DisclosureListPanelActions,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Button } from "@/components/ui/buttons/Button";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import {
  DEFAULT_FRETBOARD_INLAY_PRESET,
  type CustomFretboardInlayPresetName,
  type FretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import { type FretboardIcon } from "@/data/fretboard/icons";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import {
  FRETBOARD_MAX_FRET,
  FRETBOARD_MIN_FRET,
} from "@/utils/fretboard/fretboardConfigPrimitives";
import { areRangesEqual } from "@/utils/range/numberRange";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import { BoundedRangeSliderGroup } from "@/components/ui/range-slider/BoundedRangeSliderGroup";
import { FretboardInlayPresetSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import { FretboardAppearanceEditor } from "@/components/instrument/InstrumentAppearanceEditor";
import { CustomTuningsDialog } from "@/components/fretboard-tuning/CustomTuningsDialog";
import { FretboardTuningChoices } from "@/components/fretboard-tuning/FretboardTuningChoices";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import {
  conventionalToFretboardTuning,
  formatCustomOpenStringNotes,
  fretboardToConventionalTuning,
} from "@/utils/fretboard/customFretboardTunings";
import { type FretboardInstrumentSelection } from "./instrumentCreationConfig";
import { formatFretRange } from "./instrumentCreationCopy";
import { formatOpenStringNotes, fretboardInstrumentGroups } from "./options";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

const MIN_FRET_RANGE_SPAN = 2;

type FretboardChoice =
  "instrument" | "tuning" | "fretRange" | "handedness" | "appearance";
type AppearanceEditor = "custom";

interface FretboardInstrumentCreationPanelProps {
  closeSignal?: number;
  value: FretboardInstrumentSelection;
  onChange: (value: FretboardInstrumentSelection) => void;
  onChoiceOpen?: () => void;
}

export function FretboardInstrumentCreationPanel({
  closeSignal,
  value,
  onChange,
  onChoiceOpen,
}: FretboardInstrumentCreationPanelProps) {
  const [isCustomTuningsOpen, setIsCustomTuningsOpen] = useState(false);
  const { closeAll, closeChoice, openChoice, toggleChoice } =
    useDisclosureList<FretboardChoice>();
  const {
    closeAll: closeAppearanceEditors,
    open: openAppearanceEditorChoice,
    openChoice: openAppearanceEditor,
    toggleChoice: toggleAppearanceEditor,
  } = useDisclosureList<AppearanceEditor>();

  useEffect(() => {
    closeAll();
    closeAppearanceEditors();
  }, [closeAll, closeAppearanceEditors, closeSignal]);

  const handleToggleChoice = (choice: FretboardChoice) => {
    if (openChoice !== choice) {
      onChoiceOpen?.();
    }
    if (choice !== "appearance" || openChoice === "appearance") {
      closeAppearanceEditors();
    }
    toggleChoice(choice);
  };
  const selectedInstrument = stringInstruments[value.instrument];
  const selectedNamedTuning = value.tuningKey
    ? stringInstrumentTunings[value.tuningKey]
    : undefined;
  const selectedOpenMidiNotes = value.tuning
    ? fretboardToConventionalTuning(value.tuning)
    : [
        ...(
          selectedNamedTuning ??
          stringInstrumentTunings[selectedInstrument.defaultTuning]
        ).openMidiNotes,
      ];
  const selectedTuningName =
    value.tuningName ?? selectedNamedTuning?.primaryName ?? "Custom";
  const selectedTuningNotes = value.tuning
    ? formatCustomOpenStringNotes(selectedOpenMidiNotes)
    : formatOpenStringNotes(
        selectedNamedTuning ??
          stringInstrumentTunings[selectedInstrument.defaultTuning],
      );
  const defaultThemeName = getDefaultFretboardWoodThemeName(value.instrument);
  const effectiveThemeName = getEffectiveFretboardThemeName(value);
  const effectiveInlayPresetName = getEffectiveFretboardInlayPresetName(value);
  const appearanceSummary = formatAppearanceSummary(value);
  const customAppearanceSummary = formatCustomAppearanceSummary(value);
  const autoAppearanceSummary = formatAutoAppearanceSummary(
    value.instrument,
    defaultThemeName,
  );
  const handleInstrumentSelect = (instrument: StringInstrumentKey) => {
    const {
      tuning: _tuning,
      tuningName: _tuningName,
      ...selectionWithoutCustomTuning
    } = value;

    onChange({
      ...selectionWithoutCustomTuning,
      instrument,
      tuningKey: stringInstruments[instrument].defaultTuning,
    });
    closeChoice("instrument");
  };
  const handleTuningSelect = (tuningKey: StringInstrumentTuningKey) => {
    const {
      tuning: _tuning,
      tuningName: _tuningName,
      ...selectionWithoutCustomTuning
    } = value;

    onChange({ ...selectionWithoutCustomTuning, tuningKey });
    closeChoice("tuning");
  };
  const handleCustomTuningSelect = (tuning: SavedFretboardTuning) => {
    const { tuningKey: _tuningKey, ...selectionWithoutNamedTuning } = value;

    onChange({
      ...selectionWithoutNamedTuning,
      tuning: conventionalToFretboardTuning(tuning.openMidiNotes),
      tuningName: tuning.name,
    });
    closeChoice("tuning");
  };
  const handleFretRangeSelect = (fretRange: readonly [number, number]) => {
    onChange({ ...value, fretRange });
    closeChoice("fretRange");
  };
  const handleHandednessSelect = (handedness: "right" | "left") => {
    onChange({ ...value, handedness });
    closeChoice("handedness");
  };
  const handleAppearanceAutoSelect = () => {
    onChange({ ...value, appearanceSource: "auto" });
    closeAppearanceEditors();
  };
  const handleAppearanceCustomToggle = () => {
    if (value.appearanceSource !== "custom") {
      onChange({ ...value, appearanceSource: "custom" });
      openAppearanceEditorChoice("custom");
      return;
    }

    toggleAppearanceEditor("custom");
  };
  const handleThemeSelect = (theme: FretboardThemeName) => {
    onChange({ ...value, appearanceSource: "custom", theme });
  };
  const handleInlayPresetSelect = (
    inlayPreset: CustomFretboardInlayPresetName,
  ) => {
    onChange({ ...value, appearanceSource: "custom", inlayPreset });
  };
  const handleAppearanceDone = () => {
    closeAppearanceEditors();
    closeChoice("appearance");
  };
  const handleFretRangeChange = (fretRange: readonly [number, number]) => {
    onChange({ ...value, fretRange });
  };

  return (
    <section className={styles.section} aria-label="Fretboard settings">
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Choose instrument, ${selectedInstrument.primaryName} selected`}
          isOpen={openChoice === "instrument"}
          keepMounted
          label="Instrument"
          preview={selectedInstrument.primaryName}
          onToggle={() => handleToggleChoice("instrument")}
        >
          <DisclosureList grouped>
            {fretboardInstrumentGroups.map((group) => (
              <DisclosureListGroup key={group.title}>
                {group.options.map((option) => (
                  <DisclosureListChoice
                    key={option.id}
                    label={option.title}
                    selected={value.instrument === option.id}
                    onClick={() => handleInstrumentSelect(option.id)}
                  />
                ))}
              </DisclosureListGroup>
            ))}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Choose tuning, ${selectedTuningName} selected`}
          isOpen={openChoice === "tuning"}
          keepMounted
          label="Tuning"
          preview={selectedTuningName}
          subtitle={selectedTuningNotes}
          onToggle={() => handleToggleChoice("tuning")}
        >
          <FretboardTuningChoices
            instrument={value.instrument}
            tuningKey={value.tuningKey}
            onManage={() => setIsCustomTuningsOpen(true)}
            onNamedSelect={handleTuningSelect}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Choose hand, ${formatHandedness(value.handedness)} selected`}
          isOpen={openChoice === "handedness"}
          keepMounted
          label="Hand"
          preview={formatHandedness(value.handedness)}
          onToggle={() => handleToggleChoice("handedness")}
        >
          <DisclosureList>
            <DisclosureListChoice
              label={formatHandedness("right")}
              selected={value.handedness === "right"}
              onClick={() => handleHandednessSelect("right")}
            />
            <DisclosureListChoice
              label={formatHandedness("left")}
              selected={value.handedness === "left"}
              onClick={() => handleHandednessSelect("left")}
            />
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Choose fret range, ${formatFretRange(value.fretRange)} selected`}
          isOpen={openChoice === "fretRange"}
          keepMounted
          label="Fret Range"
          preview={formatFretRange(value.fretRange)}
          onToggle={() => handleToggleChoice("fretRange")}
        >
          <DisclosureList>
            {fretRangeOptions.map((option) => (
              <DisclosureListChoice
                key={formatFretRange(option)}
                label={formatFretRange(option)}
                selected={areRangesEqual(value.fretRange, option)}
                onClick={() => handleFretRangeSelect(option)}
              />
            ))}
          </DisclosureList>

          <BoundedRangeSliderGroup
            endLabel="Last fret"
            max={FRETBOARD_MAX_FRET}
            min={FRETBOARD_MIN_FRET}
            minSpan={MIN_FRET_RANGE_SPAN}
            startLabel="First fret"
            value={value.fretRange}
            valueFormatter={formatFretPosition}
            onChange={handleFretRangeChange}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Choose appearance, ${appearanceSummary} selected`}
          isOpen={openChoice === "appearance"}
          keepMounted
          label="Appearance"
          preview={
            <FretboardInlayPresetSwatch
              handedness={value.handedness}
              instrument={value.instrument}
              presetName={effectiveInlayPresetName}
              themeName={effectiveThemeName}
            />
          }
          subtitle={appearanceSummary}
          onToggle={() => handleToggleChoice("appearance")}
        >
          <div className={styles.appearanceDisclosure}>
            <DisclosureList
              className={styles.appearanceModeOptions}
              density="compact"
            >
              <DisclosureListChoice
                aria-label={`Use auto appearance, ${autoAppearanceSummary}`}
                density="compact"
                label="Auto"
                selected={value.appearanceSource === "auto"}
                subtitle={autoAppearanceSummary}
                onClick={handleAppearanceAutoSelect}
              />

              <DisclosureListChoiceItem
                ariaLabel={`Choose custom appearance, ${customAppearanceSummary} selected`}
                density="compact"
                isOpen={
                  value.appearanceSource === "custom" &&
                  openAppearanceEditor === "custom"
                }
                keepMounted
                label="Custom"
                panelVariant="menu"
                selected={value.appearanceSource === "custom"}
                subtitle={customAppearanceSummary}
                onToggle={handleAppearanceCustomToggle}
              >
                <FretboardAppearanceEditor
                  allowAuto={false}
                  closeSignal={closeSignal}
                  handedness={value.handedness}
                  inlayPreset={value.inlayPreset}
                  instrument={value.instrument}
                  theme={value.theme}
                  onInlayPresetChange={(inlayPreset) => {
                    if (inlayPreset && inlayPreset !== "auto") {
                      handleInlayPresetSelect(inlayPreset);
                    }
                  }}
                  onThemeChange={(theme) => {
                    if (theme) {
                      handleThemeSelect(theme);
                    }
                  }}
                />
              </DisclosureListChoiceItem>
            </DisclosureList>

            <DisclosureListPanelActions>
              <Button label="Done" size="sm" onClick={handleAppearanceDone} />
            </DisclosureListPanelActions>
          </div>
        </DisclosureListItem>
      </DisclosureList>

      <CustomTuningsDialog
        instrument={value.instrument}
        isOpen={isCustomTuningsOpen}
        seedOpenMidiNotes={selectedOpenMidiNotes}
        selected={
          value.tuning
            ? {
                name: value.tuningName,
                openMidiNotes: selectedOpenMidiNotes,
              }
            : undefined
        }
        onClose={() => setIsCustomTuningsOpen(false)}
        onSelect={handleCustomTuningSelect}
      />
    </section>
  );
}

const fretRangeOptions = [
  [0, 5],
  [0, 9],
  [0, 12],
  [0, 24],
] as const satisfies readonly (readonly [number, number])[];

function formatFretPosition(fret: number) {
  return `Fret ${fret}`;
}

function formatHandedness(
  handedness: FretboardInstrumentSelection["handedness"],
) {
  return handedness === "right" ? "Right Handed" : "Left Handed";
}

function getEffectiveFretboardThemeName(
  value: Pick<
    FretboardInstrumentSelection,
    "appearanceSource" | "instrument" | "theme"
  >,
): FretboardThemeName {
  return value.appearanceSource === "auto"
    ? getDefaultFretboardWoodThemeName(value.instrument)
    : value.theme;
}

function getEffectiveFretboardInlayPresetName(
  value: Pick<FretboardInstrumentSelection, "appearanceSource" | "inlayPreset">,
): FretboardInlayPresetName {
  return value.appearanceSource === "auto"
    ? DEFAULT_FRETBOARD_INLAY_PRESET
    : value.inlayPreset;
}

function formatAppearanceSummary(value: FretboardInstrumentSelection) {
  return value.appearanceSource === "auto"
    ? "Auto"
    : `Custom${DISPLAY_VALUE_SEPARATOR}${formatCustomAppearanceSummary(value)}`;
}

function formatCustomAppearanceSummary(
  value: Pick<FretboardInstrumentSelection, "inlayPreset" | "theme">,
) {
  return `${fretboardThemes[value.theme].title}${DISPLAY_VALUE_SEPARATOR}${formatInlayPresetLabel(
    value.inlayPreset,
  )}`;
}

function formatAutoAppearanceSummary(
  instrument: StringInstrumentKey,
  themeName: FretboardThemeName,
) {
  const config = createFretboardConfig(themeName, { instrument });
  const woodLabel = fretboardThemes[themeName].title;
  const inlayLabel = config.showFretInlays
    ? formatInlayIconLabel(config.fretInlayImage)
    : "No Inlay";

  return `${woodLabel}${DISPLAY_VALUE_SEPARATOR}${inlayLabel} for ${
    stringInstruments[instrument].primaryName
  }`;
}

function formatInlayIconLabel(icon: FretboardIcon) {
  switch (icon) {
    case "circle":
      return "Dot Inlay";
    case "paw-print":
      return "Paw Print Inlay";
    case "trapezoid":
      return "Classic Inlay";
  }
}

function formatInlayPresetLabel(presetName: FretboardInlayPresetName) {
  switch (presetName) {
    case "none":
      return "No Inlay";
    case "dots":
      return "Dot Inlay";
    case "pawPrint":
      return "Paw Print Inlay";
    case "trapezoid":
      return "Classic Inlay";
    case "auto":
    default:
      return "Auto Inlay";
  }
}
