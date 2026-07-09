"use client";

import {
  AudioWaveform,
  CaseSensitive,
  ListMusic,
  Ruler,
  SwatchBook,
} from "lucide-react";
import {
  stringInstrumentTunings,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { useState } from "react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
  getDisplayFormatLabel,
} from "@/data/displayFormats";
import { type InstrumentSize } from "@/types/instrument-layout";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import {
  resolveInstrumentAudioPresetId,
  type InstrumentAudioPresetContext,
} from "@/utils/instrument/resolveInstrumentAudioPreset";
import {
  FretboardAppearanceEditor,
  KeyboardAppearanceEditor,
} from "./InstrumentAppearanceEditor";
import {
  FretboardInlayPresetSwatch,
  KeyboardThemeSwatch,
} from "./InstrumentThemeSwatch";
import {
  DEFAULT_FRETBOARD_INLAY_PRESET,
  fretboardInlayPresets,
  type FretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import { type FretboardConfig } from "@/types/fretboard";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import { CustomTuningsDialog } from "@/components/fretboard-tuning/CustomTuningsDialog";
import {
  FretboardTuningChoices,
  formatCustomOpenStringNotes,
} from "@/components/fretboard-tuning/FretboardTuningChoices";
import {
  conventionalToFretboardTuning,
  fretboardToConventionalTuning,
} from "@/utils/fretboard/customFretboardTunings";
import { formatOpenStringNotes } from "@/components/instrument-creation/options";

export type InstrumentMenuChoice =
  "appearance" | "sound" | "display" | "size" | "tuning";

export interface FretboardAppearanceSettings {
  handedness: "left" | "right";
  inlayPreset?: FretboardInlayPresetName;
  instrument: StringInstrumentKey;
  onInlayPresetChange: (
    inlayPreset: FretboardInlayPresetName | undefined,
  ) => void;
  onThemeChange: (theme: FretboardThemeName | undefined) => void;
  theme?: FretboardThemeName;
}

export interface FretboardTuningSettings {
  config?: FretboardConfig;
  instrument: StringInstrumentKey;
  onConfigChange: (config: FretboardConfig) => void;
  tuning: readonly number[];
  tuningKey?: StringInstrumentTuningKey;
  tuningName?: string;
}

export interface KeyboardAppearanceSettings {
  onThemeChange: (theme: KeyboardThemeName) => void;
  theme?: KeyboardThemeName;
}

interface InstrumentMenuDialogProps {
  audioPresetId?: AudioPresetId;
  audioPresetContext?: InstrumentAudioPresetContext;
  displayFormatId: DisplayFormatId;
  initialOpenChoice?: InstrumentMenuChoice | null;
  instrumentSize: InstrumentSize;
  instrumentType: InstrumentType;
  isOpen: boolean;
  fretboardAppearance?: FretboardAppearanceSettings;
  fretboardTuning?: FretboardTuningSettings;
  keyboardAppearance?: KeyboardAppearanceSettings;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onClone?: () => void;
  onClose: () => void;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onInstrumentDisplaySizeChange?: SettingSetter<InstrumentSize>;
  onRemove?: () => void;
}

const instrumentSizeOptions = [
  {
    id: "compact",
    label: "Compact",
  },
  {
    id: "comfortable",
    label: "Comfortable",
  },
  {
    id: "large",
    label: "Large",
  },
] as const satisfies readonly {
  id: InstrumentSize;
  label: string;
}[];

const instrumentSizeLabels = Object.fromEntries(
  instrumentSizeOptions.map((option) => [option.id, option.label]),
) as Record<InstrumentSize, string>;

function auditionAudioPreset(audioPresetId: AudioPresetId) {
  void ensureAudioReady();
  void musoAudioEngine.playNote({
    midiNote: 60,
    presetId: audioPresetId,
    use: "preview",
    velocity: 0.82,
  });
}

export function InstrumentMenuDialog({
  audioPresetId,
  audioPresetContext,
  displayFormatId,
  initialOpenChoice = null,
  instrumentSize,
  instrumentType,
  isOpen,
  fretboardAppearance,
  fretboardTuning,
  keyboardAppearance,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onDisplayFormatIdChange,
  onInstrumentDisplaySizeChange,
  onRemove,
}: InstrumentMenuDialogProps) {
  const [isCustomTuningsOpen, setIsCustomTuningsOpen] = useState(false);
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<InstrumentMenuChoice>(initialOpenChoice);
  const resolvedAudioPresetId = resolveInstrumentAudioPresetId(
    instrumentType,
    audioPresetId,
    audioPresetContext,
  );
  const resolvedAudioPreset = audioPresets[resolvedAudioPresetId];
  const resolvedKeyboardTheme =
    keyboardAppearance?.theme ?? DEFAULT_KEYBOARD_THEME;
  const resolvedFretboardTheme = fretboardAppearance
    ? (fretboardAppearance.theme ??
      getDefaultFretboardWoodThemeName(fretboardAppearance.instrument))
    : undefined;
  const resolvedFretboardInlayPreset =
    fretboardAppearance?.inlayPreset ?? DEFAULT_FRETBOARD_INLAY_PRESET;
  const appearanceSummary =
    instrumentType === "keyboard"
      ? keyboardThemes[resolvedKeyboardTheme].title
      : fretboardAppearance && resolvedFretboardTheme
        ? `${
            fretboardAppearance.theme
              ? fretboardThemes[fretboardAppearance.theme].title
              : "Auto Wood"
          }${DISPLAY_VALUE_SEPARATOR}${
            fretboardAppearance.inlayPreset
              ? fretboardInlayPresets[fretboardAppearance.inlayPreset].title
              : "Auto Inlay"
          }`
        : undefined;
  const namedFretboardTuning = fretboardTuning?.tuningKey
    ? stringInstrumentTunings[fretboardTuning.tuningKey]
    : undefined;
  const fretboardOpenMidiNotes = fretboardTuning
    ? fretboardToConventionalTuning(fretboardTuning.tuning)
    : undefined;
  const fretboardTuningLabel =
    fretboardTuning?.tuningName ??
    namedFretboardTuning?.primaryName ??
    "Custom";
  const fretboardTuningNotes = fretboardOpenMidiNotes
    ? fretboardTuning?.tuningName
      ? formatCustomOpenStringNotes(fretboardOpenMidiNotes)
      : namedFretboardTuning
        ? formatOpenStringNotes(namedFretboardTuning)
        : formatCustomOpenStringNotes(fretboardOpenMidiNotes)
    : undefined;

  const handleAudioPresetChange = (nextAudioPresetId: AudioPresetId) => {
    onAudioPresetIdChange?.(nextAudioPresetId);
    auditionAudioPreset(nextAudioPresetId);
  };

  const handleDisplayFormatChange = (displayFormatId: DisplayFormatId) => {
    onDisplayFormatIdChange(displayFormatId);
    onClose();
  };

  const handleInstrumentDisplaySizeChange = (size: InstrumentSize) => {
    onInstrumentDisplaySizeChange?.(size);
    onClose();
  };

  const handleClone = () => {
    onClone?.();
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  const handleNamedTuningSelect = (tuningKey: StringInstrumentTuningKey) => {
    if (!fretboardTuning) {
      return;
    }

    const {
      tuning: _tuning,
      tuningName: _tuningName,
      ...configWithoutCustomTuning
    } = fretboardTuning.config ?? {};
    fretboardTuning.onConfigChange({
      ...configWithoutCustomTuning,
      instrument: fretboardTuning.instrument,
      tuningKey,
    });
    onClose();
  };

  const handleCustomTuningSelect = (tuning: SavedFretboardTuning) => {
    if (!fretboardTuning) {
      return;
    }

    const { tuningKey: _tuningKey, ...configWithoutNamedTuning } =
      fretboardTuning.config ?? {};
    fretboardTuning.onConfigChange({
      ...configWithoutNamedTuning,
      instrument: fretboardTuning.instrument,
      tuning: conventionalToFretboardTuning(tuning.openMidiNotes),
      tuningName: tuning.name,
    });
  };

  return (
    <>
      <ObjectMenuDialog
        isOpen={isOpen}
        title="Instrument Options"
        onClose={onClose}
      >
        <DisclosureListGroup>
          <DisclosureListItem
            ariaLabel={`Playback sound. Current: ${resolvedAudioPreset.label}`}
            icon={<AudioWaveform />}
            isOpen={isChoiceOpen("sound")}
            label="Playback Sound"
            onToggle={() => toggleChoice("sound")}
            panelVariant="menu"
            preview={resolvedAudioPreset.label}
          >
            <AudioPresetChoiceList
              disabled={!onAudioPresetIdChange}
              getChoiceAriaLabel={(preset) =>
                `Use ${preset.label} playback sound`
              }
              onChange={handleAudioPresetChange}
              selectedPresetId={resolvedAudioPresetId}
              surface="instrument"
            />
          </DisclosureListItem>

          {fretboardTuning && fretboardOpenMidiNotes && fretboardTuningNotes ? (
            <DisclosureListItem
              ariaLabel={`Tuning. Current: ${fretboardTuningLabel}`}
              icon={<ListMusic />}
              isOpen={isChoiceOpen("tuning")}
              label="Tuning"
              onToggle={() => toggleChoice("tuning")}
              panelVariant="menu"
              preview={fretboardTuningLabel}
              subtitle={fretboardTuningNotes}
            >
              <FretboardTuningChoices
                instrument={fretboardTuning.instrument}
                tuning={
                  fretboardTuning.tuningKey ? undefined : fretboardTuning.tuning
                }
                tuningKey={fretboardTuning.tuningKey}
                tuningName={fretboardTuning.tuningName}
                onCustomSelect={(tuning) => {
                  handleCustomTuningSelect(tuning);
                  onClose();
                }}
                onManage={() => setIsCustomTuningsOpen(true)}
                onNamedSelect={handleNamedTuningSelect}
              />
            </DisclosureListItem>
          ) : null}

          {instrumentType === "keyboard" && keyboardAppearance ? (
            <DisclosureListItem
              ariaLabel={`Appearance. Current: ${appearanceSummary}`}
              icon={<SwatchBook />}
              isOpen={isChoiceOpen("appearance")}
              label="Appearance"
              onToggle={() => toggleChoice("appearance")}
              panelVariant="menu"
              preview={
                <KeyboardThemeSwatch themeName={resolvedKeyboardTheme} />
              }
              subtitle={appearanceSummary}
            >
              <KeyboardAppearanceEditor
                theme={resolvedKeyboardTheme}
                onThemeChange={keyboardAppearance.onThemeChange}
              />
            </DisclosureListItem>
          ) : null}

          {instrumentType === "fretboard" &&
          fretboardAppearance &&
          resolvedFretboardTheme ? (
            <DisclosureListItem
              ariaLabel={`Appearance. Current: ${appearanceSummary}`}
              icon={<SwatchBook />}
              isOpen={isChoiceOpen("appearance")}
              label="Appearance"
              onToggle={() => toggleChoice("appearance")}
              panelVariant="menu"
              preview={
                <FretboardInlayPresetSwatch
                  handedness={fretboardAppearance.handedness}
                  instrument={fretboardAppearance.instrument}
                  presetName={resolvedFretboardInlayPreset}
                  themeName={resolvedFretboardTheme}
                />
              }
              subtitle={appearanceSummary}
            >
              <FretboardAppearanceEditor {...fretboardAppearance} />
            </DisclosureListItem>
          ) : null}

          <DisclosureListItem
            ariaLabel={`Note labels. Current: ${getDisplayFormatLabel(
              displayFormatId,
            )}`}
            icon={<CaseSensitive />}
            isOpen={isChoiceOpen("display")}
            label="Note Labels"
            onToggle={() => toggleChoice("display")}
            panelVariant="menu"
            preview={getDisplayFormatLabel(displayFormatId)}
          >
            <DisplayFormatPicker
              value={displayFormatId}
              onChange={handleDisplayFormatChange}
            />
          </DisclosureListItem>

          <DisclosureListItem
            ariaLabel={`Instrument size. Current: ${
              instrumentSizeLabels[instrumentSize]
            }`}
            icon={<Ruler />}
            isOpen={isChoiceOpen("size")}
            label="Instrument Size"
            onToggle={() => toggleChoice("size")}
            panelVariant="menu"
            preview={instrumentSizeLabels[instrumentSize]}
          >
            <DisclosureList>
              {instrumentSizeOptions.map((option) => (
                <DisclosureListChoice
                  key={option.id}
                  disabled={!onInstrumentDisplaySizeChange}
                  label={option.label}
                  onClick={() => handleInstrumentDisplaySizeChange(option.id)}
                  selected={option.id === instrumentSize}
                />
              ))}
            </DisclosureList>
          </DisclosureListItem>
        </DisclosureListGroup>

        <ObjectManagementGroup
          kind="instrument"
          onDanger={onRemove ? handleRemove : undefined}
          onDuplicate={onClone ? handleClone : undefined}
        />
      </ObjectMenuDialog>

      {fretboardTuning && fretboardOpenMidiNotes ? (
        <CustomTuningsDialog
          instrument={fretboardTuning.instrument}
          isOpen={isCustomTuningsOpen}
          seedOpenMidiNotes={fretboardOpenMidiNotes}
          selected={
            fretboardTuning.tuningName
              ? {
                  name: fretboardTuning.tuningName,
                  openMidiNotes: fretboardOpenMidiNotes,
                }
              : undefined
          }
          onClose={() => setIsCustomTuningsOpen(false)}
          onSelect={handleCustomTuningSelect}
        />
      ) : null}
    </>
  );
}
