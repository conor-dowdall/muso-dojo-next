"use client";

import { useState } from "react";
import { Disc3, Gauge } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { SessionTempoEditor } from "@/components/session/SessionTempoEditor";
import { Button } from "@/components/ui/buttons/Button";
import {
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { Text } from "@/components/ui/typography/Text";
import { useArrangementEntryLoopTransport } from "@/hooks/audio/useArrangementEntryLoopTransport";
import { useAppStore } from "@/stores/appStore";

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
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const setTempoOverride = useAppStore(
    (state) => state.setArrangementEntryTempoOverrideBpm,
  );
  const loopTransport = useArrangementEntryLoopTransport(
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
    if (entry.tempoOverrideBpm === tempoBpm) return;
    stopOwnedPlayback();
    setTempoOverride(arrangementId, entryId, tempoBpm);
  };

  return (
    <ObjectMenuDialog
      footer={
        <DialogFooter>
          <DialogFooterActionBar ariaLabel="Section playback actions">
            <DialogFooterActionGroup placement="secondary">
              <Button
                disabled={!loopTransport.canPlay}
                label={loopTransport.isActive ? "Stop" : "Loop This Section"}
                selected={loopTransport.isActive}
                size="lg"
                onClick={loopTransport.togglePlayback}
              />
            </DialogFooterActionGroup>
            <DialogFooterActionGroup placement="primary">
              <Button label="Close" size="lg" onClick={onClose} />
            </DialogFooterActionGroup>
          </DialogFooterActionBar>
        </DialogFooter>
      }
      icon={<Disc3 />}
      isOpen={isOpen}
      size="standard"
      title={`Playback for Section ${sectionNumber}`}
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Tempo for Section ${sectionNumber}. Current: ${hasOverride ? "Override" : "Arrangement Tempo"}, ${effectiveTempo} bpm`}
          icon={<Gauge />}
          isOpen={tempoOpen}
          label="Tempo"
          preview={`${hasOverride ? "Override" : "Arrangement Tempo"} · ${effectiveTempo} BPM`}
          onToggle={() => setTempoOpen((open) => !open)}
        >
          <Text as="p" size="sm" variant="muted">
            Sections inherit the Arrangement Tempo unless overridden.
          </Text>
          <DisclosureList density="compact">
            <DisclosureListChoice
              label="Arrangement Tempo"
              preview={`${arrangement.tempoBpm} BPM`}
              selected={!hasOverride}
              selectedPreviewKind="current"
              onClick={() => setOverride(undefined)}
            />
            <DisclosureListChoice
              label="Override"
              preview={`${effectiveTempo} BPM`}
              selected={hasOverride}
              selectedPreviewKind="current"
              onClick={() => setOverride(arrangement.tempoBpm)}
            />
          </DisclosureList>
          {hasOverride ? (
            <SessionTempoEditor
              label={`Tempo (BPM) for Section ${sectionNumber}`}
              tempoBpm={entry.tempoOverrideBpm!}
              onTempoBpmChange={setOverride}
            />
          ) : null}
        </DisclosureListItem>
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}
