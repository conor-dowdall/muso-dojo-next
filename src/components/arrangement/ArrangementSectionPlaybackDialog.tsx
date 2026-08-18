"use client";

import { useState } from "react";
import {
  Disc3,
  Gauge,
  Infinity,
  ListVideo,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { SessionTempoEditor } from "@/components/session/SessionTempoEditor";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { SelectableActionRow } from "@/components/ui/selectable-overflow-row";
import { useArrangementEntryLoopTransport } from "@/hooks/audio/useArrangementEntryLoopTransport";
import { useArrangementPlayFromEntryTransport } from "@/hooks/audio/useArrangementPlayFromEntryTransport";
import { useAppStore } from "@/stores/appStore";
import { formatValueSummary } from "@/utils/valueSummary";

export function ArrangementSectionPlaybackDialog({
  arrangementId,
  entryId,
  isOpen,
  onClose,
  sectionNumber,
}: {
  arrangementId: string;
  entryId: string;
  isOpen: boolean;
  onClose: () => void;
  sectionNumber: string;
}) {
  const [tempoOpen, setTempoOpen] = useState(false);
  const [overrideSettingsOpen, setOverrideSettingsOpen] = useState(false);
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const setTempoOverride = useAppStore(
    (state) => state.setArrangementEntryTempoOverrideBpm,
  );
  const loopTransport = useArrangementEntryLoopTransport(
    arrangementId,
    entryId,
  );
  const playFromHereTransport = useArrangementPlayFromEntryTransport(
    arrangementId,
    entryId,
  );
  const entry = arrangement?.entries.find(({ id }) => id === entryId);
  if (!arrangement || !entry) return null;

  const hasOverride = entry.tempoOverrideBpm !== undefined;
  const effectiveTempo = entry.tempoOverrideBpm ?? arrangement.tempoBpm;
  const stopOwnedPlayback = () => {
    const snapshot = partSequenceCoordinator.getSnapshot();
    if (
      snapshot.playing &&
      snapshot.owner?.kind === "arrangement" &&
      snapshot.owner.id === arrangementId
    ) {
      partSequenceCoordinator.stop();
    }
  };
  const setOverride = (tempoBpm: number | undefined) => {
    if (tempoBpm === undefined) {
      setOverrideSettingsOpen(false);
    }
    if (entry.tempoOverrideBpm === tempoBpm) return;
    stopOwnedPlayback();
    setTempoOverride(arrangementId, entryId, tempoBpm);
  };

  return (
    <ObjectMenuDialog
      icon={<Disc3 />}
      isOpen={isOpen}
      size="standard"
      title={`Playback for Section ${sectionNumber}`}
      onClose={() => {
        setTempoOpen(false);
        setOverrideSettingsOpen(false);
        onClose();
      }}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Tempo for Section ${sectionNumber}. Current: ${hasOverride ? "Override" : "Arrangement Tempo"}, ${effectiveTempo} BPM`}
          icon={<Gauge />}
          isOpen={tempoOpen}
          label="Tempo"
          preview={formatValueSummary([
            hasOverride ? "Override" : "Arrangement Tempo",
            `${effectiveTempo} BPM`,
          ])}
          onToggle={() => {
            if (tempoOpen) setOverrideSettingsOpen(false);
            setTempoOpen((open) => !open);
          }}
        >
          <DisclosureList density="compact">
            <SelectableActionRow
              label="Arrangement Tempo"
              preview={`${arrangement.tempoBpm} BPM`}
              selected={!hasOverride}
              selectedAriaLabel={`Arrangement Tempo selected, ${arrangement.tempoBpm} BPM`}
              selectedPreviewKind="current"
              selectAriaLabel={`Use Arrangement Tempo, ${arrangement.tempoBpm} BPM`}
              onSelect={() => setOverride(undefined)}
            />
            <SelectableActionRow
              actionDisabled={!hasOverride}
              actionIcon={<SlidersHorizontal />}
              actionLabel="Override tempo settings"
              isActionOpen={Boolean(hasOverride && overrideSettingsOpen)}
              keepPanelMounted
              label="Override"
              preview={`${effectiveTempo} BPM`}
              selected={hasOverride}
              selectedAriaLabel={`Tempo Override selected, ${effectiveTempo} BPM`}
              selectedPreviewKind="current"
              selectAriaLabel={`Use a Section tempo override, initially ${arrangement.tempoBpm} BPM`}
              onAction={() => setOverrideSettingsOpen((open) => !open)}
              onSelect={() => setOverride(arrangement.tempoBpm)}
            >
              {hasOverride ? (
                <SessionTempoEditor
                  label={`Tempo (BPM) for Section ${sectionNumber}`}
                  tempoBpm={entry.tempoOverrideBpm!}
                  onTempoBpmChange={setOverride}
                />
              ) : null}
            </SelectableActionRow>
          </DisclosureList>
        </DisclosureListItem>
      </DisclosureListGroup>
      <DisclosureListGroup aria-label="Playback" role="group">
        <DisclosureListAction
          aria-label={
            playFromHereTransport.isActive
              ? "Stop Arrangement"
              : `Play Arrangement from Section ${sectionNumber}`
          }
          disabled={!playFromHereTransport.canPlay}
          icon={playFromHereTransport.isActive ? <Square /> : <ListVideo />}
          label={
            playFromHereTransport.isActive
              ? "Stop Arrangement"
              : "Play From Here"
          }
          selected={playFromHereTransport.isActive}
          onClick={playFromHereTransport.togglePlayback}
        />
        <DisclosureListAction
          aria-label={
            loopTransport.isActive
              ? "Stop Section Loop"
              : `Loop Section ${sectionNumber}`
          }
          disabled={!loopTransport.canPlay}
          icon={loopTransport.isActive ? <Square /> : <Infinity />}
          label={
            loopTransport.isActive ? "Stop Section Loop" : "Loop This Section"
          }
          selected={loopTransport.isActive}
          onClick={loopTransport.togglePlayback}
        />
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}
