"use client";

import { type ReactNode } from "react";
import { Drum, Repeat, Timer } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import {
  formatPartLengthBeats,
  USER_PART_LENGTH_BEAT_CHOICES,
} from "@/utils/music-part/partLength";
import { type PartBandRole, type PartBandSourceConfig } from "@/types/session";
import { useMusicPart } from "./MusicPartContext";

type PlaybackChoice = "backingNotes" | "duration" | "rhythm";

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
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PlaybackChoice>(null);
  const rhythmSource = part.band.rhythm;
  const selectedRhythmOption =
    rhythmSource.mode === "module"
      ? part.bandModuleOptions.rhythm.find(
          (option) => option.id === rhythmSource.moduleId,
        )
      : undefined;
  const durationPreview =
    part.lengthMode === "rhythm"
      ? `Rhythm · ${formatPartLengthBeats(part.effectiveLengthBeats)}`
      : formatPartLengthBeats(part.effectiveLengthBeats);
  const backingNotesPreview = getSourcePreview(part, "backingNotes");
  const rhythmPreview = getSourcePreview(part, "rhythm");

  const chooseSource = (role: PartBandRole, source: PartBandSourceConfig) => {
    part.setBandSource?.(role, source);
    toggleChoice(role);
  };

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      size="compact"
      title="Practice Band for Part"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Part length. Current: ${durationPreview}`}
          icon={<Timer />}
          isOpen={isChoiceOpen("duration")}
          label="Part Length"
          panelVariant="menu"
          preview={durationPreview}
          subtitle="How long the band stays on this Part"
          onToggle={() => toggleChoice("duration")}
        >
          <DisclosureList density="compact">
            {selectedRhythmOption ? (
              <DisclosureListChoice
                label="Follow Band Rhythm"
                preview={selectedRhythmOption.detail}
                selected={part.lengthMode === "rhythm"}
                selectedPreviewKind="current"
                subtitle="Update automatically when its beat count changes"
                onClick={() => {
                  part.setLengthMode?.("rhythm");
                  toggleChoice("duration");
                }}
              />
            ) : null}
            {USER_PART_LENGTH_BEAT_CHOICES.map((lengthBeats) => (
              <DisclosureListChoice
                key={lengthBeats}
                label={formatPartLengthBeats(lengthBeats)}
                selected={
                  part.lengthMode === "fixed" &&
                  part.lengthBeats === lengthBeats
                }
                selectedPreviewKind="current"
                onClick={() => {
                  part.setLengthBeats?.(lengthBeats);
                  toggleChoice("duration");
                }}
              />
            ))}
          </DisclosureList>
        </DisclosureListItem>
      </DisclosureListGroup>

      <DisclosureListGroup>
        <BandSourceDisclosure
          automaticPreview="From this Part's notes"
          icon={<Repeat />}
          isOpen={isChoiceOpen("backingNotes")}
          label="Backing Notes"
          moduleNoun="Looper"
          preview={backingNotesPreview}
          role="backingNotes"
          onChoose={chooseSource}
          onToggle={() => toggleChoice("backingNotes")}
        />
        <BandSourceDisclosure
          automaticPreview={
            part.automaticRhythm === "swing" ? "Swing" : "Standard"
          }
          icon={<Drum />}
          isOpen={isChoiceOpen("rhythm")}
          label="Rhythm"
          moduleNoun="Rhythm"
          preview={rhythmPreview}
          role="rhythm"
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
  if (source.mode === "automatic") {
    return role === "rhythm"
      ? `Automatic · ${part.automaticRhythm === "swing" ? "Swing" : "Standard"}`
      : "Automatic";
  }

  if (source.mode === "off") {
    return "Off";
  }

  return (
    part.bandModuleOptions[role].find((option) => option.id === source.moduleId)
      ?.label ?? "Automatic"
  );
}

function BandSourceDisclosure({
  automaticPreview,
  icon,
  isOpen,
  label,
  moduleNoun,
  onChoose,
  onToggle,
  preview,
  role,
}: {
  automaticPreview: string;
  icon: ReactNode;
  isOpen: boolean;
  label: string;
  moduleNoun: string;
  onChoose: (role: PartBandRole, source: PartBandSourceConfig) => void;
  onToggle: () => void;
  preview: string;
  role: PartBandRole;
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
      subtitle={`Choose one ${moduleNoun.toLowerCase()} for the band`}
      onToggle={onToggle}
    >
      <DisclosureList density="compact">
        <DisclosureListChoice
          label="Automatic"
          preview={automaticPreview}
          selected={source.mode === "automatic"}
          selectedPreviewKind="current"
          onClick={() => onChoose(role, { mode: "automatic" })}
        />
        <DisclosureListChoice
          label="Off"
          selected={source.mode === "off"}
          selectedPreviewKind="current"
          subtitle={`No ${label.toLowerCase()} in the Practice Band`}
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
              preview={option.detail}
              selected={sourceIsSelected(source, candidate)}
              selectedPreviewKind="current"
              onClick={() => onChoose(role, candidate)}
            />
          );
        })}
      </DisclosureList>
    </DisclosureListItem>
  );
}
