"use client";

import {
  DisclosureList,
  DisclosureListChoice,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  rhythmPresetIds,
  rhythmPresets,
  type RhythmPresetId,
} from "@/utils/rhythm/rhythmConfig";

export function RhythmPresetChoiceList({
  disabled,
  onChange,
  selectedPresetId,
}: {
  disabled?: boolean;
  onChange: (presetId: RhythmPresetId) => void;
  selectedPresetId: RhythmPresetId;
}) {
  return (
    <DisclosureList density="compact">
      {rhythmPresetIds.map((presetId) => {
        const preset = rhythmPresets[presetId];

        return (
          <DisclosureListChoice
            key={preset.id}
            aria-label={`Use ${preset.label} rhythm`}
            disabled={disabled}
            label={preset.label}
            onClick={() => onChange(preset.id)}
            selected={preset.id === selectedPresetId}
            subtitle={preset.description.replace(/\.$/, "")}
          />
        );
      })}
    </DisclosureList>
  );
}
