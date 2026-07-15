"use client";

import { useState } from "react";
import { Disc3, Drum, Music2, SlidersHorizontal, Timer } from "lucide-react";
import { RHYTHM_MAX_BEATS } from "@/data/rhythmPresets";
import {
  ExerciseOctaveDisclosure,
  ExercisePlaybackSoundDisclosure,
} from "@/components/exercise-looper/ExerciseVoiceDisclosureItems";
import { RhythmCreationPanel } from "@/components/rhythm/RhythmCreationPanel";
import {
  DisclosureList,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { SelectableActionRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import {
  getSessionBackingBandConfig,
  MAX_SESSION_BACKING_BAND_COUNT_IN_BEATS,
  MIN_SESSION_BACKING_BAND_COUNT_IN_BEATS,
} from "@/utils/session/sessionBackingBand";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  getSessionRhythmBarConstraint,
  sessionRhythmBeatsPreserveAuthoredBars,
} from "@/utils/music-part/sessionRhythmCompatibility";
import { formatValueSummary } from "@/utils/valueSummary";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
  getBandChoosesRhythmSummary,
} from "./backingBandSummaries";

type MainChoice = "backing-notes" | "count-in" | "rhythm";
type BackingNotesChoice = "octave" | "sound";

function formatCountIn(beats: number) {
  if (beats === 0) {
    return "Off";
  }

  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
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
  const backingNotesDisclosure = useDisclosureList<BackingNotesChoice>(null);
  const [isBackingNotesSettingsOpen, setIsBackingNotesSettingsOpen] =
    useState(false);
  const [isCustomRhythmSettingsOpen, setIsCustomRhythmSettingsOpen] =
    useState(false);
  const backingBand = getSessionBackingBandConfig(session?.backingBand);
  const backingNotesPreview = backingBand.looper.enabled ? "On" : "Off";
  const backingNotesSummary = getBackingNotesSummary(backingBand.looper);
  const bandChoosesSummary = getBandChoosesRhythmSummary(session?.parts ?? []);
  const customRhythmRecipe = getRhythmSelectionRecipe(
    backingBand.rhythm.selection,
  );
  const sessionRhythmConstraint = getSessionRhythmBarConstraint(
    session?.parts ?? [],
  );
  const customRhythmPreservesSplitBars = sessionRhythmBeatsPreserveAuthoredBars(
    session?.parts ?? [],
    customRhythmRecipe.beats,
  );
  const rhythmBeatCountConstraint =
    sessionRhythmConstraint.requiredBarDivision > 1 &&
    sessionRhythmConstraint.requiredBarDivision <= RHYTHM_MAX_BEATS
      ? {
          requiredBarDivision: sessionRhythmConstraint.requiredBarDivision,
        }
      : undefined;
  const customRhythmSummary = formatValueSummary([
    getBackingRhythmSummary(backingBand.rhythm.selection),
    customRhythmPreservesSplitBars ? undefined : "Split Bars Play Separately",
  ]);
  const rhythmPreview =
    backingBand.rhythm.mode === "custom"
      ? "Custom"
      : backingBand.rhythm.mode === "off"
        ? "Off"
        : "Band Chooses";

  const update = (next: typeof backingBand) =>
    setSessionBackingBand(sessionId, next);

  return (
    <ObjectMenuDialog
      icon={<Disc3 />}
      isOpen={isOpen}
      size="standard"
      title="Session Backing Band"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Backing Notes. Current: ${backingNotesPreview}`}
          icon={<Music2 />}
          isOpen={mainDisclosure.isOpen("backing-notes")}
          label="Backing Notes"
          panelVariant="menu"
          preview={backingNotesPreview}
          onToggle={() => mainDisclosure.toggleChoice("backing-notes")}
        >
          <DisclosureList density="compact">
            <SelectableActionRow
              actionDisabled={!backingBand.looper.enabled}
              actionIcon={<SlidersHorizontal />}
              actionLabel="Backing Notes settings"
              isActionOpen={
                backingBand.looper.enabled ? isBackingNotesSettingsOpen : false
              }
              keepPanelMounted
              label="On"
              selected={backingBand.looper.enabled}
              selectedAriaLabel="Backing Notes on"
              selectedPreviewKind="current"
              selectAriaLabel="Turn Backing Notes on"
              subtitle={backingNotesSummary}
              onAction={() =>
                setIsBackingNotesSettingsOpen((current) => !current)
              }
              onSelect={() =>
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, enabled: true },
                })
              }
            >
              <DisclosureList density="compact">
                <ExercisePlaybackSoundDisclosure
                  audioPresetId={backingBand.looper.audioPresetId}
                  isOpen={backingNotesDisclosure.isOpen("sound")}
                  showIcon={false}
                  onChange={(audioPresetId) =>
                    update({
                      ...backingBand,
                      looper: { ...backingBand.looper, audioPresetId },
                    })
                  }
                  onToggle={() => backingNotesDisclosure.toggleChoice("sound")}
                />
                <ExerciseOctaveDisclosure
                  isOpen={backingNotesDisclosure.isOpen("octave")}
                  octaveOffset={backingBand.looper.octaveOffset}
                  showIcon={false}
                  onChange={(octaveOffset) =>
                    update({
                      ...backingBand,
                      looper: { ...backingBand.looper, octaveOffset },
                    })
                  }
                  onToggle={() => backingNotesDisclosure.toggleChoice("octave")}
                />
              </DisclosureList>
            </SelectableActionRow>
            <SelectableActionRow
              label="Off"
              selected={!backingBand.looper.enabled}
              selectedAriaLabel="Backing Notes off"
              selectedPreviewKind="current"
              selectAriaLabel="Turn Backing Notes off"
              onSelect={() => {
                setIsBackingNotesSettingsOpen(false);
                update({
                  ...backingBand,
                  looper: { ...backingBand.looper, enabled: false },
                });
              }}
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
            <SelectableActionRow
              label="Band Chooses"
              selected={backingBand.rhythm.mode === "automatic"}
              selectedAriaLabel="Band Chooses Rhythm selected"
              selectedPreviewKind="current"
              selectAriaLabel="Let the Band choose the Rhythm"
              subtitle={bandChoosesSummary}
              onSelect={() => {
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
              subtitle={customRhythmSummary}
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
                beatCountConstraint={rhythmBeatCountConstraint}
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
            <SelectableActionRow
              label="Off"
              selected={backingBand.rhythm.mode === "off"}
              selectedAriaLabel="Rhythm off"
              selectedPreviewKind="current"
              selectAriaLabel="Turn Rhythm off"
              onSelect={() => {
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
