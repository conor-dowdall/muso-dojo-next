"use client";

import { AudioWaveform, CaseSensitive, Ruler } from "lucide-react";
import {
  audioPresetCategoryLabels,
  audioPresetCategoryOrder,
  audioPresets,
  isAudioPresetRecommendedForUse,
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
import { type InstrumentSize } from "@/types/instrument-layout";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import {
  resolveInstrumentAudioPresetId,
  type InstrumentAudioPresetContext,
} from "@/utils/instrument/resolveInstrumentAudioPreset";
import styles from "./InstrumentMenuDialog.module.css";

export type InstrumentMenuChoice = "sound" | "display" | "size";

interface InstrumentMenuDialogProps {
  audioPresetId?: AudioPresetId;
  audioPresetContext?: InstrumentAudioPresetContext;
  displayFormatId: DisplayFormatId;
  initialOpenChoice?: InstrumentMenuChoice | null;
  instrumentSize: InstrumentSize;
  instrumentType: InstrumentType;
  isOpen: boolean;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onClone?: () => void;
  onClose: () => void;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onInstrumentDisplaySizeChange?: SettingSetter<InstrumentSize>;
  onRemove?: () => void;
}

const previewAudioPresetGroups = audioPresetCategoryOrder
  .map((category) => ({
    category,
    label: audioPresetCategoryLabels[category],
    presets: Object.values(audioPresets).filter(
      (preset) =>
        preset.category === category &&
        isAudioPresetRecommendedForUse(preset, "preview"),
    ),
  }))
  .filter((group) => group.presets.length > 0);

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
  onAudioPresetIdChange,
  onClone,
  onClose,
  onDisplayFormatIdChange,
  onInstrumentDisplaySizeChange,
  onRemove,
}: InstrumentMenuDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<InstrumentMenuChoice>(initialOpenChoice);
  const resolvedAudioPresetId = resolveInstrumentAudioPresetId(
    instrumentType,
    audioPresetId,
    audioPresetContext,
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
        level="instrument"
        onDanger={onRemove ? handleRemove : undefined}
        onDuplicate={onClone ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
