"use client";

import { useState } from "react";
import { AudioWaveform, Copy, Trash2, Type, Wrench } from "lucide-react";
import {
  audioPresetCategoryLabels,
  audioPresetCategoryOrder,
  audioPresets,
  isAudioPresetSupportedForUse,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import { Button } from "@/components/ui/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListConfirmAction,
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
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import styles from "./InstrumentSettingsDialog.module.css";

export type InstrumentSettingsChoice = "sound" | "display" | "instrument";

interface InstrumentSettingsDialogProps {
  audioPresetId?: AudioPresetId;
  displayFormatId: DisplayFormatId;
  initialOpenChoice?: InstrumentSettingsChoice | null;
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

export function InstrumentSettingsDialog({
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
}: InstrumentSettingsDialogProps) {
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<InstrumentSettingsChoice>(initialOpenChoice);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const resolvedAudioPresetId = resolveInstrumentAudioPresetId(
    instrumentType,
    audioPresetId,
  );
  const resolvedAudioPreset = audioPresets[resolvedAudioPresetId];
  const hasInstrumentActions = Boolean(onClone || onRemove);
  const instrumentActionsPreview = [
    onClone ? "Duplicate" : undefined,
    onRemove ? "Remove" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

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
    <Dialog isOpen={isOpen} onClose={onClose} size="md">
      <DialogHeader title="Instrument Settings" onClose={onClose} />
      <DialogContent className={styles.settingsContent}>
        <DisclosureList>
          <DisclosureListItem
            ariaLabel={`Sound. Current: ${resolvedAudioPreset.label}`}
            icon={<AudioWaveform />}
            isOpen={isChoiceOpen("sound")}
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
            isOpen={isChoiceOpen("display")}
            label="Display"
            onToggle={() => toggleChoice("display")}
            panelVariant="menu"
            preview={getDisplayFormatLabel(displayFormatId)}
          >
            <DisplayFormatPicker
              value={displayFormatId}
              onChange={handleDisplayFormatChange}
            />
          </DisclosureListItem>

          {hasInstrumentActions ? (
            <DisclosureListItem
              ariaLabel="Instrument actions"
              icon={<Wrench />}
              isOpen={isChoiceOpen("instrument")}
              label="Instrument"
              onToggle={() => toggleChoice("instrument")}
              panelVariant="menu"
              subtitle={instrumentActionsPreview}
            >
              <DisclosureList density="compact">
                {onClone ? (
                  <DisclosureListAction
                    aria-label="Duplicate instrument"
                    icon={<Copy />}
                    label="Duplicate"
                    onClick={handleClone}
                  />
                ) : null}
                {onRemove ? (
                  <DisclosureListConfirmAction
                    actionAriaLabel="Remove instrument"
                    confirmAriaLabel="Confirm remove instrument"
                    confirmButtonLabel="Remove"
                    confirmLabel="Remove this instrument?"
                    icon={<Trash2 />}
                    isConfirming={isConfirmingRemove}
                    label="Remove"
                    onCancel={() => setIsConfirmingRemove(false)}
                    onConfirm={handleRemove}
                    onRequestConfirm={() => setIsConfirmingRemove(true)}
                    tone="danger"
                  />
                ) : null}
              </DisclosureList>
            </DisclosureListItem>
          ) : null}
        </DisclosureList>
      </DialogContent>
      <DialogFooter className={styles.settingsFooter}>
        <section className={styles.footerActions} aria-label="Dialog actions">
          <Button label="Done" size="lg" variant="filled" onClick={onClose} />
        </section>
      </DialogFooter>
    </Dialog>
  );
}
