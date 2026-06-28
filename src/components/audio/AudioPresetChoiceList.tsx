"use client";

import {
  getAudioPresetsForSurface,
  type AudioPreset,
  type AudioPresetId,
  type AudioPresetSurface,
} from "@/audio";
import {
  DisclosureList,
  DisclosureListChoice,
} from "@/components/ui/disclosure-list/DisclosureList";

interface AudioPresetChoiceListProps {
  disabled?: boolean;
  getChoiceAriaLabel: (preset: AudioPreset) => string;
  onChange: (presetId: AudioPresetId) => void;
  selectedPresetId: AudioPresetId;
  surface: AudioPresetSurface;
}

export function AudioPresetChoiceList({
  disabled,
  getChoiceAriaLabel,
  onChange,
  selectedPresetId,
  surface,
}: AudioPresetChoiceListProps) {
  const presets = getAudioPresetsForSurface(surface);

  return (
    <DisclosureList density="compact">
      {presets.map((preset) => (
        <DisclosureListChoice
          key={preset.id}
          aria-label={getChoiceAriaLabel(preset)}
          disabled={disabled}
          label={preset.label}
          onClick={() => onChange(preset.id)}
          selected={preset.id === selectedPresetId}
        />
      ))}
    </DisclosureList>
  );
}
