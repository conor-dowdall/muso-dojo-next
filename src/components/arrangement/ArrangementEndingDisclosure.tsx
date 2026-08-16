"use client";

import { useEffect } from "react";
import { FlagTriangleRight, SlidersHorizontal } from "lucide-react";
import { formatNoteNameWithMidiOctave } from "@musodojo/music-theory-data";
import { audioPresets } from "@/audio";
import {
  ExerciseOctaveDisclosure,
  ExercisePlaybackSoundDisclosure,
} from "@/components/exercise-looper/ExerciseVoiceDisclosureItems";
import { AddToSessionRootNoteItem } from "@/components/session/AddToSessionRootNoteItem";
import {
  DisclosureList,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { SelectableActionRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import {
  createArrangementEndingSeed,
  getArrangementEndingMidi,
} from "@/utils/arrangement/arrangementEnding";
import { formatValueSummary } from "@/utils/valueSummary";

type EndingSetting = "octave" | "root" | "sound";

export function ArrangementEndingDisclosure({
  arrangementId,
  isOpen,
  isPlaybackActive,
  onToggle,
}: {
  arrangementId: string;
  isOpen: boolean;
  isPlaybackActive: boolean;
  onToggle: () => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const setArrangementEnding = useAppStore(
    (state) => state.setArrangementEnding,
  );
  const {
    closeAll: closeBandEndingSettings,
    isOpen: isBandEndingSettingOpen,
    toggleChoice: toggleBandEndingSetting,
  } = useDisclosureList<"settings">();
  const {
    closeAll,
    isOpen: isSettingOpen,
    toggleChoice,
  } = useDisclosureList<EndingSetting>();
  const ending = arrangement?.ending;
  const isBandEndingSettingsOpen =
    Boolean(ending) && isBandEndingSettingOpen("settings");

  useEffect(() => {
    if (!isOpen || !ending || !isBandEndingSettingsOpen) {
      closeAll();
    }
    if (!isOpen || !ending) {
      closeBandEndingSettings();
    }
  }, [
    closeAll,
    closeBandEndingSettings,
    ending,
    isBandEndingSettingsOpen,
    isOpen,
  ]);

  if (!arrangement) return null;
  const midi = ending ? getArrangementEndingMidi(ending) : undefined;
  const summary = ending
    ? formatValueSummary([
        "Band Ending",
        formatNoteNameWithMidiOctave(ending.rootNote, midi!),
        audioPresets[ending.audioPresetId].label,
      ])
    : "Off";

  return (
    <DisclosureListItem
      ariaLabel={`Ending. Current: ${summary}`}
      icon={<FlagTriangleRight />}
      isOpen={isOpen}
      label="Ending"
      panelVariant="menu"
      preview={summary}
      onToggle={onToggle}
    >
      <DisclosureList density="compact">
        <SelectableActionRow
          actionDisabled={!ending}
          actionIcon={<SlidersHorizontal />}
          actionLabel="Band Ending settings"
          isActionOpen={Boolean(ending) && isBandEndingSettingsOpen}
          keepPanelMounted
          label="Band Ending"
          selected={Boolean(ending)}
          selectedAriaLabel="Band Ending selected"
          selectAriaLabel="Use Band Ending"
          subtitle="Kick and crash with a sustained ending note."
          onAction={() => toggleBandEndingSetting("settings")}
          onSelect={() =>
            setArrangementEnding(
              arrangementId,
              ending ?? createArrangementEndingSeed(arrangement),
            )
          }
        >
          {ending ? (
            <DisclosureList density="compact">
              <AddToSessionRootNoteItem
                isOpen={isSettingOpen("root")}
                label="Ending Note"
                selectedRootNote={ending.rootNote}
                value={ending.rootNote}
                onChange={(rootNote) =>
                  setArrangementEnding(arrangementId, { ...ending, rootNote })
                }
                onToggle={() => toggleChoice("root")}
              />
              <ExercisePlaybackSoundDisclosure
                audioPresetId={ending.audioPresetId}
                isOpen={isSettingOpen("sound")}
                isPlaybackActive={isPlaybackActive}
                keepMounted
                previewMidiNote={midi}
                showIcon={false}
                onChange={(audioPresetId) =>
                  setArrangementEnding(arrangementId, {
                    ...ending,
                    audioPresetId,
                  })
                }
                onToggle={() => toggleChoice("sound")}
              />
              <ExerciseOctaveDisclosure
                isOpen={isSettingOpen("octave")}
                keepMounted
                octaveOffset={ending.octaveOffset}
                showIcon={false}
                onChange={(octaveOffset) =>
                  setArrangementEnding(arrangementId, {
                    ...ending,
                    octaveOffset,
                  })
                }
                onToggle={() => toggleChoice("octave")}
              />
            </DisclosureList>
          ) : null}
        </SelectableActionRow>
        <SelectableActionRow
          label="Off"
          selected={!ending}
          selectedAriaLabel="Ending off"
          selectAriaLabel="Turn Ending off"
          onSelect={() => {
            closeBandEndingSettings();
            setArrangementEnding(arrangementId, undefined);
          }}
        />
      </DisclosureList>
    </DisclosureListItem>
  );
}
