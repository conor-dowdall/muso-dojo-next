"use client";

import { useState } from "react";
import {
  Circle,
  CircleDot,
  CircleOff,
  Hash,
  Music2,
  Settings,
  Type,
} from "lucide-react";
import {
  audioPresetCategoryLabels,
  audioPresetCategoryOrder,
  audioPresets,
  isAudioPresetSupportedForUse,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Typography } from "@/components/ui/typography/Typography";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
  getDisplayFormatLabel,
} from "@/data/displayFormats";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import styles from "./InstrumentSettingsButton.module.css";

type InstrumentSettingsChoice = "sound" | "display" | "notes" | "midi";

interface InstrumentSettingsButtonProps {
  audioPresetId?: AudioPresetId;
  displayFormatId: DisplayFormatId;
  instrumentType: InstrumentType;
  noteEmphasis: InstrumentNoteEmphasis;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onNoteEmphasisChange: InstrumentNoteEmphasisSetter;
  onShowMidiNumbersChange?: SettingSetter<boolean>;
  showMidiNumbers?: boolean;
}

const noteEmphasisLabels = {
  large: "Large",
  small: "Small",
  hidden: "Hidden",
} as const satisfies Record<InstrumentNoteEmphasis, string>;

const noteEmphasisSubtitles = {
  large: "Prominent note labels",
  small: "Compact note labels",
  hidden: "Color only",
} as const satisfies Record<InstrumentNoteEmphasis, string>;

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

function getNoteEmphasisIcon(noteEmphasis: InstrumentNoteEmphasis) {
  switch (noteEmphasis) {
    case "large":
      return <Circle />;
    case "small":
      return <CircleDot />;
    case "hidden":
      return <CircleOff />;
  }
}

function auditionAudioPreset(audioPresetId: AudioPresetId) {
  void musoAudioEngine.playNote({
    durationSeconds: 0.72,
    midiNote: 60,
    presetId: audioPresetId,
    use: "preview",
    velocity: 0.82,
  });
}

export function InstrumentSettingsButton({
  audioPresetId,
  displayFormatId,
  instrumentType,
  noteEmphasis,
  onAudioPresetIdChange,
  onDisplayFormatIdChange,
  onNoteEmphasisChange,
  onShowMidiNumbersChange,
  showMidiNumbers = false,
}: InstrumentSettingsButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isOpen, toggleChoice } =
    useDisclosureList<InstrumentSettingsChoice>("sound");
  const resolvedAudioPresetId = resolveInstrumentAudioPresetId(
    instrumentType,
    audioPresetId,
  );
  const resolvedAudioPreset = audioPresets[resolvedAudioPresetId];
  const midiLabel = showMidiNumbers ? "On" : "Off";

  const handleAudioPresetChange = (nextAudioPresetId: AudioPresetId) => {
    onAudioPresetIdChange?.(nextAudioPresetId);
    auditionAudioPreset(nextAudioPresetId);
  };

  return (
    <>
      <IconButton
        aria-label="Instrument settings"
        icon={<Settings />}
        size="sm"
        tooltip="Instrument settings"
        onClick={() => setIsDialogOpen(true)}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        size="md"
      >
        <DialogHeader
          title="Instrument Settings"
          onClose={() => setIsDialogOpen(false)}
        />
        <DialogContent className={styles.settingsContent}>
          <DisclosureList>
            <DisclosureListItem
              ariaLabel={`Sound. Current: ${resolvedAudioPreset.label}`}
              icon={<Music2 />}
              isOpen={isOpen("sound")}
              label="Sound"
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
                        aria-label={`Use ${preset.label} sound`}
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
              ariaLabel={`Display format. Current: ${getDisplayFormatLabel(
                displayFormatId,
              )}`}
              icon={<Type />}
              isOpen={isOpen("display")}
              label="Display"
              onToggle={() => toggleChoice("display")}
              panelVariant="menu"
              preview={getDisplayFormatLabel(displayFormatId)}
            >
              <DisplayFormatPicker
                value={displayFormatId}
                onChange={onDisplayFormatIdChange}
              />
            </DisclosureListItem>

            <DisclosureListItem
              ariaLabel={`Default note size. Current: ${noteEmphasisLabels[noteEmphasis]}`}
              icon={getNoteEmphasisIcon(noteEmphasis)}
              isOpen={isOpen("notes")}
              label="Note Size"
              onToggle={() => toggleChoice("notes")}
              panelVariant="menu"
              preview={noteEmphasisLabels[noteEmphasis]}
            >
              <DisclosureList density="compact">
                {(["large", "small", "hidden"] as const).map((option) => (
                  <DisclosureListChoice
                    key={option}
                    aria-label={`Set default note size to ${noteEmphasisLabels[option]}`}
                    icon={getNoteEmphasisIcon(option)}
                    label={noteEmphasisLabels[option]}
                    onClick={() => onNoteEmphasisChange(option)}
                    selected={option === noteEmphasis}
                    subtitle={noteEmphasisSubtitles[option]}
                  />
                ))}
              </DisclosureList>
            </DisclosureListItem>

            <DisclosureListItem
              ariaLabel={`MIDI numbers. Current: ${midiLabel}`}
              icon={<Hash />}
              isOpen={isOpen("midi")}
              label="MIDI Numbers"
              onToggle={() => toggleChoice("midi")}
              panelVariant="menu"
              preview={midiLabel}
            >
              <DisclosureList density="compact">
                <DisclosureListChoice
                  aria-label="Hide MIDI numbers"
                  disabled={!onShowMidiNumbersChange}
                  label="Off"
                  onClick={() => onShowMidiNumbersChange?.(false)}
                  selected={!showMidiNumbers}
                  subtitle="Use the selected display format"
                />
                <DisclosureListChoice
                  aria-label="Show MIDI numbers"
                  disabled={!onShowMidiNumbersChange}
                  label="On"
                  onClick={() => onShowMidiNumbersChange?.(true)}
                  selected={showMidiNumbers}
                  subtitle="Show note numbers on the instrument"
                />
              </DisclosureList>
            </DisclosureListItem>
          </DisclosureList>
        </DialogContent>
      </Dialog>
    </>
  );
}
