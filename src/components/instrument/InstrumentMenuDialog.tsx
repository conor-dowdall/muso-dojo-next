"use client";

import { AudioWaveform, CaseSensitive } from "lucide-react";
import {
  audioPresetCategoryLabels,
  audioPresetCategoryOrder,
  audioPresets,
  isAudioPresetSupportedForUse,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
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
import { Typography } from "@/components/ui/typography/Typography";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
  getDisplayFormatLabel,
} from "@/data/displayFormats";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import styles from "./InstrumentMenuDialog.module.css";

export type InstrumentMenuChoice = "sound" | "display";

interface InstrumentMenuDialogProps {
  audioPresetId?: AudioPresetId;
  displayFormatId: DisplayFormatId;
  initialOpenChoice?: InstrumentMenuChoice | null;
  instrumentType: InstrumentType;
  isOpen: boolean;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onClone?: () => void;
  onClose: () => void;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onRemove?: () => void;
}

const previewAudioPresetGroups = audioPresetCategoryOrder
  .map((category) => ({
    category,
    label: audioPresetCategoryLabels[category],
    presets: Object.values(audioPresets).filter(
      (preset) =>
        preset.category === category &&
        isAudioPresetSupportedForUse(preset, "preview"),
    ),
  }))
  .filter((group) => group.presets.length > 0);

function auditionAudioPreset(audioPresetId: AudioPresetId) {
  void musoAudioEngine.playNote({
    durationSeconds: 0.72,
    midiNote: 60,
    presetId: audioPresetId,
    use: "preview",
    velocity: 0.82,
  });
}

export function InstrumentMenuDialog({
  audioPresetId,
  displayFormatId,
  initialOpenChoice = null,
  instrumentType,
  isOpen,
  onAudioPresetIdChange,
  onClone,
  onClose,
  onDisplayFormatIdChange,
  onRemove,
}: InstrumentMenuDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<InstrumentMenuChoice>(initialOpenChoice);
  const resolvedAudioPresetId = resolveInstrumentAudioPresetId(
    instrumentType,
    audioPresetId,
  );
  const resolvedAudioPreset = audioPresets[resolvedAudioPresetId];

  const handleAudioPresetChange = (nextAudioPresetId: AudioPresetId) => {
    onAudioPresetIdChange?.(nextAudioPresetId);
    auditionAudioPreset(nextAudioPresetId);
  };

  const handleDisplayFormatChange = (displayFormatId: DisplayFormatId) => {
    onDisplayFormatIdChange(displayFormatId);
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

  return (
    <ObjectMenuDialog isOpen={isOpen} level="instrument" onClose={onClose}>
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
          <DisclosureList grouped groupGap="related" density="compact">
            {previewAudioPresetGroups.map((group) => (
              <DisclosureListGroup
                key={group.category}
                aria-label={group.label}
              >
                <Typography
                  as="div"
                  className={styles.groupLabel}
                  size="xs"
                  variant="muted"
                  weight="semibold"
                  caps
                >
                  {group.label}
                </Typography>
                {group.presets.map((preset) => (
                  <DisclosureListChoice
                    key={preset.id}
                    aria-label={`Use ${preset.label} playback sound`}
                    disabled={!onAudioPresetIdChange}
                    label={preset.label}
                    onClick={() => handleAudioPresetChange(preset.id)}
                    selected={preset.id === resolvedAudioPresetId}
                    subtitle={preset.description}
                  />
                ))}
              </DisclosureListGroup>
            ))}
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Display text. Current: ${getDisplayFormatLabel(
            displayFormatId,
          )}`}
          icon={<CaseSensitive />}
          isOpen={isChoiceOpen("display")}
          label="Display Text"
          onToggle={() => toggleChoice("display")}
          panelVariant="menu"
          preview={getDisplayFormatLabel(displayFormatId)}
        >
          <DisplayFormatPicker
            value={displayFormatId}
            onChange={handleDisplayFormatChange}
          />
        </DisclosureListItem>
      </DisclosureListGroup>

      <ObjectManagementGroup
        level="instrument"
        onDanger={onRemove ? handleRemove : undefined}
        onDuplicate={onClone ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
