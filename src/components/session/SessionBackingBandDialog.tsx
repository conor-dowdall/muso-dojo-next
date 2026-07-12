"use client";

import { useState } from "react";
import { Drum, Repeat, SlidersHorizontal, Timer } from "lucide-react";
import {
  ExerciseOctaveDisclosure,
  ExercisePlaybackSoundDisclosure,
} from "@/components/exercise-looper/ExerciseVoiceDisclosureItems";
import { RhythmCreationPanel } from "@/components/rhythm/RhythmCreationPanel";
import { getRhythmRecipeCreationSummary } from "@/components/rhythm/rhythmRecipeControls";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { SelectableActionRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { formatValueSummary } from "@/utils/valueSummary";
import {
  getSessionBackingBandConfig,
  MAX_SESSION_BACKING_BAND_COUNT_IN_BEATS,
  MIN_SESSION_BACKING_BAND_COUNT_IN_BEATS,
} from "@/utils/session/sessionBackingBand";

type MainChoice = "count-in" | "looper" | "rhythm";
type LooperChoice = "octave" | "sound";

function formatCountIn(beats: number) {
  if (beats === 0) {
    return "No Count In";
  }

  return `${beats} Beat Count In`;
}

export function SessionBackingBandDialog({
  isOpen,
  onClose,
  sessionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}) {
  const session = useAppStore((state) => state.sessions[sessionId]);
  const setSessionBackingBand = useAppStore(
    (state) => state.setSessionBackingBand,
  );
  const mainDisclosure = useDisclosureList<MainChoice>(null);
  const looperDisclosure = useDisclosureList<LooperChoice>(null);
  const [isCustomRhythmSettingsOpen, setIsCustomRhythmSettingsOpen] =
    useState(false);
  const backingBand = getSessionBackingBandConfig(session?.backingBand);
  const looperPreview = backingBand.looper.enabled ? "On" : "Off";
  const rhythmPreview =
    backingBand.rhythm.mode === "custom"
      ? "Custom"
      : backingBand.rhythm.mode === "off"
        ? "Off"
        : "Per Part";

  const update = (next: typeof backingBand) =>
    setSessionBackingBand(sessionId, next);

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      size="standard"
      title="Session Backing Band"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Backing Notes. Current: ${looperPreview}`}
          icon={<Repeat />}
          isOpen={mainDisclosure.isOpen("looper")}
          label="Backing Notes"
          panelVariant="menu"
          preview={looperPreview}
          onToggle={() => mainDisclosure.toggleChoice("looper")}
        >
          <DisclosureList density="compact">
            <DisclosureListChoice
              label="On"
              selected={backingBand.looper.enabled}
              selectedPreviewKind="current"
              onClick={() =>
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, enabled: true },
                })
              }
            />
            <DisclosureListChoice
              label="Off"
              selected={!backingBand.looper.enabled}
              selectedPreviewKind="current"
              onClick={() =>
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, enabled: false },
                })
              }
            />
            <ExercisePlaybackSoundDisclosure
              audioPresetId={backingBand.looper.audioPresetId}
              disabled={!backingBand.looper.enabled}
              isOpen={looperDisclosure.isOpen("sound")}
              showIcon={false}
              onChange={(audioPresetId) =>
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, audioPresetId },
                })
              }
              onToggle={() => looperDisclosure.toggleChoice("sound")}
            />
            <ExerciseOctaveDisclosure
              disabled={!backingBand.looper.enabled}
              isOpen={looperDisclosure.isOpen("octave")}
              octaveOffset={backingBand.looper.octaveOffset}
              showIcon={false}
              onChange={(octaveOffset) =>
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, octaveOffset },
                })
              }
              onToggle={() => looperDisclosure.toggleChoice("octave")}
            />
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Rhythm. Current: ${rhythmPreview}`}
          icon={<Drum />}
          isOpen={mainDisclosure.isOpen("rhythm")}
          label="Rhythm"
          panelVariant="menu"
          preview={rhythmPreview}
          onToggle={() => mainDisclosure.toggleChoice("rhythm")}
        >
          <DisclosureList density="compact">
            <DisclosureListChoice
              label="Per Part"
              selected={backingBand.rhythm.mode === "automatic"}
              selectedPreviewKind="current"
              subtitle="Uses each Part's recommended feel and length"
              onClick={() => {
                setIsCustomRhythmSettingsOpen(false);
                update({
                  ...backingBand,
                  rhythm: { ...backingBand.rhythm, mode: "automatic" },
                });
              }}
            />
            <SelectableActionRow
              actionDisabled={backingBand.rhythm.mode !== "custom"}
              actionIcon={<SlidersHorizontal />}
              actionLabel="Custom Rhythm settings"
              isActionOpen={
                backingBand.rhythm.mode === "custom" &&
                isCustomRhythmSettingsOpen
              }
              keepPanelMounted
              label="Custom"
              selected={backingBand.rhythm.mode === "custom"}
              selectedAriaLabel="Custom Rhythm selected"
              selectedPreviewKind="current"
              selectAriaLabel="Use Custom Rhythm"
              subtitle={formatValueSummary([
                getRhythmRecipeCreationSummary(
                  getRhythmSelectionRecipe(backingBand.rhythm.selection),
                ),
                "Replaces each Part's length",
              ])}
              onAction={() =>
                setIsCustomRhythmSettingsOpen((current) => !current)
              }
              onSelect={() =>
                update({
                  ...backingBand,
                  rhythm: { ...backingBand.rhythm, mode: "custom" },
                })
              }
            >
              <RhythmCreationPanel
                ariaLabel="Session Rhythm settings"
                showWood={false}
                value={{ rhythm: backingBand.rhythm.selection }}
                onChange={(value) =>
                  update({
                    ...backingBand,
                    rhythm: {
                      mode: "custom",
                      selection: value.rhythm ?? backingBand.rhythm.selection,
                    },
                  })
                }
              />
            </SelectableActionRow>
            <DisclosureListChoice
              label="Off"
              selected={backingBand.rhythm.mode === "off"}
              selectedPreviewKind="current"
              onClick={() => {
                setIsCustomRhythmSettingsOpen(false);
                update({
                  ...backingBand,
                  rhythm: { ...backingBand.rhythm, mode: "off" },
                });
              }}
            />
          </DisclosureList>
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Count In. Current: ${formatCountIn(backingBand.countInBeats)}`}
          icon={<Timer />}
          isOpen={mainDisclosure.isOpen("count-in")}
          label="Count In"
          panelVariant="menu"
          preview={formatCountIn(backingBand.countInBeats)}
          onToggle={() => mainDisclosure.toggleChoice("count-in")}
        >
          <NumericStepper
            aria-label="Count In beats"
            formatValue={formatCountIn}
            max={MAX_SESSION_BACKING_BAND_COUNT_IN_BEATS}
            min={MIN_SESSION_BACKING_BAND_COUNT_IN_BEATS}
            value={backingBand.countInBeats}
            onChange={(countInBeats) =>
              update({ ...backingBand, countInBeats })
            }
          />
        </DisclosureListItem>
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}
