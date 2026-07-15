"use client";

import { type ReactNode } from "react";
import { Disc3, Drum, Music2 } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import {
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { usePartBandLoopTransport } from "@/components/session/PracticeBandTransport";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
} from "@/components/session/backingBandSummaries";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { type PartBandRole, type PartBandSourceConfig } from "@/types/session";
import { useMusicPart } from "./MusicPartContext";

type PlaybackChoice = "backingNotes" | "rhythm";

function sourceIsSelected(
  current: PartBandSourceConfig,
  candidate: PartBandSourceConfig,
) {
  return (
    current.mode === candidate.mode &&
    (current.mode !== "module" ||
      (candidate.mode === "module" && current.moduleId === candidate.moduleId))
  );
}

export function PartPlaybackDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const part = useMusicPart();
  const loopTransport = usePartBandLoopTransport(part.sessionId, part.partId);
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PlaybackChoice>(null);
  const automaticRhythmSummary = getBackingRhythmSummary(
    getAutomaticRhythmSelection(
      part.automaticRhythm.style,
      part.automaticLengthBeats,
    ),
  );
  const sessionBackingNotesSummary = part.sessionBackingBand.looper.enabled
    ? getBackingNotesSummary(part.sessionBackingBand.looper)
    : "Off";
  const sessionRhythmSummary =
    part.sessionBackingBand.rhythm.mode === "off"
      ? "Off"
      : part.sessionBackingBand.rhythm.mode === "custom"
        ? getBackingRhythmSummary(part.sessionBackingBand.rhythm.selection)
        : automaticRhythmSummary;
  const backingNotesPreview = getSourcePreview(part, "backingNotes");
  const rhythmPreview = getSourcePreview(part, "rhythm");

  const chooseSource = (role: PartBandRole, source: PartBandSourceConfig) => {
    part.setBandSource?.(role, source);
    toggleChoice(role);
  };

  return (
    <ObjectMenuDialog
      footer={
        <DialogFooter>
          <DialogFooterActionBar ariaLabel="Backing Band actions">
            <DialogFooterActionGroup placement="secondary">
              <Button
                disabled={!loopTransport.canPlay}
                label={loopTransport.isActive ? "Stop" : "Loop This Part"}
                selected={loopTransport.isActive}
                size="lg"
                onClick={loopTransport.togglePlayback}
              />
            </DialogFooterActionGroup>
            <DialogFooterActionGroup placement="primary">
              <Button label="Done" size="lg" onClick={onClose} />
            </DialogFooterActionGroup>
          </DialogFooterActionBar>
        </DialogFooter>
      }
      icon={<Disc3 />}
      isOpen={isOpen}
      size="standard"
      title="Backing Band for Part"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <BandSourceDisclosure
          icon={<Music2 />}
          isOpen={isChoiceOpen("backingNotes")}
          label="Backing Notes"
          preview={backingNotesPreview}
          role="backingNotes"
          sessionSubtitle={sessionBackingNotesSummary}
          onChoose={chooseSource}
          onToggle={() => toggleChoice("backingNotes")}
        />
        <BandSourceDisclosure
          icon={<Drum />}
          isOpen={isChoiceOpen("rhythm")}
          label="Rhythm"
          preview={rhythmPreview}
          role="rhythm"
          sessionSubtitle={sessionRhythmSummary}
          onChoose={chooseSource}
          onToggle={() => toggleChoice("rhythm")}
        />
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}

function getSourcePreview(
  part: ReturnType<typeof useMusicPart>,
  role: PartBandRole,
) {
  const source = part.band[role];
  if (source.mode === "session") {
    return "Session Band";
  }

  if (source.mode === "off") {
    return "Off";
  }

  const option = part.bandModuleOptions[role].find(
    (option) => option.id === source.moduleId,
  );

  return option ? option.label : "Session Band";
}

function BandSourceDisclosure({
  icon,
  isOpen,
  label,
  onChoose,
  onToggle,
  preview,
  role,
  sessionSubtitle,
}: {
  icon: ReactNode;
  isOpen: boolean;
  label: string;
  onChoose: (role: PartBandRole, source: PartBandSourceConfig) => void;
  onToggle: () => void;
  preview: string;
  role: PartBandRole;
  sessionSubtitle?: string;
}) {
  const part = useMusicPart();
  const source = part.band[role];

  return (
    <DisclosureListItem
      ariaLabel={`${label} source. Current: ${preview}`}
      icon={icon}
      isOpen={isOpen}
      label={label}
      panelVariant="menu"
      preview={preview}
      onToggle={onToggle}
    >
      <DisclosureList density="compact">
        <DisclosureListChoice
          label="Session Band"
          selected={source.mode === "session"}
          selectedPreviewKind="current"
          subtitle={sessionSubtitle}
          onClick={() => onChoose(role, { mode: "session" })}
        />
        <DisclosureListChoice
          label="Off"
          selected={source.mode === "off"}
          selectedPreviewKind="current"
          onClick={() => onChoose(role, { mode: "off" })}
        />
        {part.bandModuleOptions[role].map((option) => {
          const candidate = {
            mode: "module" as const,
            moduleId: option.id,
          };

          return (
            <DisclosureListChoice
              key={option.id}
              label={option.label}
              selected={sourceIsSelected(source, candidate)}
              selectedPreviewKind="current"
              subtitle={option.detail}
              onClick={() => onChoose(role, candidate)}
            />
          );
        })}
      </DisclosureList>
    </DisclosureListItem>
  );
}
