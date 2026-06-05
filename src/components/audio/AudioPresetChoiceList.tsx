"use client";

import {
  audioPresetCategoryLabels,
  audioPresetCategoryOrder,
  audioPresets,
  isAudioPresetRecommendedForUse,
  type AudioPreset,
  type AudioPresetId,
  type AudioUse,
} from "@/audio";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Typography } from "@/components/ui/typography/Typography";
import styles from "./AudioPresetChoiceList.module.css";

interface AudioPresetChoiceListProps {
  disabled?: boolean;
  getChoiceAriaLabel: (preset: AudioPreset) => string;
  onChange: (presetId: AudioPresetId) => void;
  recommendedUse: AudioUse;
  selectedPresetId: AudioPresetId;
}

export function getAudioPresetGroupsForUse(recommendedUse: AudioUse) {
  return audioPresetCategoryOrder
    .map((category) => ({
      category,
      label: audioPresetCategoryLabels[category],
      presets: Object.values(audioPresets).filter(
        (preset) =>
          preset.category === category &&
          isAudioPresetRecommendedForUse(preset, recommendedUse),
      ),
    }))
    .filter((group) => group.presets.length > 0);
}

function formatAudioPresetOptionSubtitle(description: string | undefined) {
  return description?.replace(/\.$/, "");
}

export function AudioPresetChoiceList({
  disabled,
  getChoiceAriaLabel,
  onChange,
  recommendedUse,
  selectedPresetId,
}: AudioPresetChoiceListProps) {
  const presetGroups = getAudioPresetGroupsForUse(recommendedUse);

  return (
    <DisclosureList grouped groupGap="related" density="compact">
      {presetGroups.map((group) => (
        <DisclosureListGroup key={group.category} aria-label={group.label}>
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
              aria-label={getChoiceAriaLabel(preset)}
              disabled={disabled}
              label={preset.label}
              onClick={() => onChange(preset.id)}
              selected={preset.id === selectedPresetId}
              subtitle={formatAudioPresetOptionSubtitle(preset.description)}
            />
          ))}
        </DisclosureListGroup>
      ))}
    </DisclosureList>
  );
}
