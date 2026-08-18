"use client";

import { type ReactNode } from "react";
import { Disc3, Drum, Infinity, ListVideo, Music2, Square } from "lucide-react";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import {
  usePartBandLoopTransport,
  usePartBandPlayFromHereTransport,
} from "@/components/session/PracticeBandTransport";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
} from "@/components/session/backingBandSummaries";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { type PartBandRole, type PartBandSourceConfig } from "@/types/session";
import {
  type MusicPartContextValue,
  useOptionalMusicPart,
} from "./MusicPartContext";

type PlaybackChoice = "backingNotes" | "rhythm";

export type PartPlaybackDialogModel = Pick<
  MusicPartContextValue,
  | "automaticLengthBeats"
  | "automaticRhythm"
  | "band"
  | "bandModuleOptions"
  | "partId"
  | "sessionBackingBand"
  | "sessionId"
  | "setBandSource"
>;

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
  part: suppliedPart,
  title = "Playback for Part",
  variant = "full",
}: {
  isOpen: boolean;
  onClose: () => void;
  part?: PartPlaybackDialogModel;
  title?: string;
  variant?: "full" | "transport";
}) {
  const contextPart = useOptionalMusicPart();
  const part = suppliedPart ?? contextPart;
  if (!part) {
    return null;
  }

  return (
    <ResolvedPartPlaybackDialog
      isOpen={isOpen}
      part={part}
      title={title}
      variant={variant}
      onClose={onClose}
    />
  );
}

function ResolvedPartPlaybackDialog({
  isOpen,
  onClose,
  part,
  title,
  variant,
}: {
  isOpen: boolean;
  onClose: () => void;
  part: PartPlaybackDialogModel;
  title: string;
  variant: "full" | "transport";
}) {
  const loopTransport = usePartBandLoopTransport(part.sessionId, part.partId);
  const playFromHereTransport = usePartBandPlayFromHereTransport(
    part.sessionId,
    part.partId,
  );
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
      icon={<Disc3 />}
      isOpen={isOpen}
      size="standard"
      title={title}
      onClose={onClose}
    >
      {variant === "full" ? (
        <DisclosureListGroup>
          <BandSourceDisclosure
            icon={<Music2 />}
            isOpen={isChoiceOpen("backingNotes")}
            label="Backing Notes Source"
            preview={backingNotesPreview}
            part={part}
            role="backingNotes"
            sessionSubtitle={sessionBackingNotesSummary}
            onChoose={chooseSource}
            onToggle={() => toggleChoice("backingNotes")}
          />
          <BandSourceDisclosure
            icon={<Drum />}
            isOpen={isChoiceOpen("rhythm")}
            label="Rhythm Source"
            preview={rhythmPreview}
            part={part}
            role="rhythm"
            sessionSubtitle={sessionRhythmSummary}
            onChoose={chooseSource}
            onToggle={() => toggleChoice("rhythm")}
          />
        </DisclosureListGroup>
      ) : null}
      <DisclosureListGroup aria-label="Playback" role="group">
        <DisclosureListAction
          aria-label={
            playFromHereTransport.isActive
              ? "Stop Session"
              : "Play Session from this Part"
          }
          disabled={!playFromHereTransport.canPlay}
          icon={playFromHereTransport.isActive ? <Square /> : <ListVideo />}
          label={
            playFromHereTransport.isActive ? "Stop Session" : "Play From Here"
          }
          selected={playFromHereTransport.isActive}
          onClick={playFromHereTransport.togglePlayback}
        />
        <DisclosureListAction
          aria-label={loopTransport.isActive ? "Stop Part Loop" : "Loop Part"}
          disabled={!loopTransport.canPlay}
          icon={loopTransport.isActive ? <Square /> : <Infinity />}
          label={loopTransport.isActive ? "Stop Part Loop" : "Loop This Part"}
          selected={loopTransport.isActive}
          onClick={loopTransport.togglePlayback}
        />
      </DisclosureListGroup>
    </ObjectMenuDialog>
  );
}

function getSourcePreview(part: PartPlaybackDialogModel, role: PartBandRole) {
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
  part,
}: {
  icon: ReactNode;
  isOpen: boolean;
  label: string;
  onChoose: (role: PartBandRole, source: PartBandSourceConfig) => void;
  onToggle: () => void;
  preview: string;
  role: PartBandRole;
  sessionSubtitle?: string;
  part: PartPlaybackDialogModel;
}) {
  const source = part.band[role];

  return (
    <DisclosureListItem
      ariaLabel={`${label}. Current: ${preview}`}
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
