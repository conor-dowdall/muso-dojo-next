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
  AUTOMATIC_RHYTHM_BEAT_CHOICES,
  formatPartLengthBeats,
} from "@/utils/music-part/partLength";
import { type PartBandRole, type PartBandSourceConfig } from "@/types/session";
import { useMusicPart } from "./MusicPartContext";

type PlaybackChoice = "automaticRhythm" | "backingNotes" | "rhythm";

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
  const automaticRhythmPreview = `${part.automaticRhythm.style === "swing" ? "Swing" : "Standard"} · ${formatPartLengthBeats(part.automaticRhythm.beats)}`;
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
          automaticPreview={automaticRhythmPreview}
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

      <DisclosureListGroup>
        <DisclosureListItem
          ariaLabel={`Automatic rhythm. Current: ${automaticRhythmPreview}`}
          icon={<Timer />}
          isOpen={isChoiceOpen("automaticRhythm")}
          label="Automatic Rhythm"
          panelVariant="menu"
          preview={automaticRhythmPreview}
          subtitle="Fallback feel and beat length for this Part"
          onToggle={() => toggleChoice("automaticRhythm")}
        >
          <DisclosureList density="compact">
            {AUTOMATIC_RHYTHM_BEAT_CHOICES.map((lengthBeats) => (
              <DisclosureListChoice
                key={lengthBeats}
                label={formatPartLengthBeats(lengthBeats)}
                selected={part.automaticRhythm.beats === lengthBeats}
                selectedPreviewKind="current"
                onClick={() => {
                  part.setAutomaticRhythmBeats?.(lengthBeats);
                  toggleChoice("automaticRhythm");
                }}
              />
            ))}
          </DisclosureList>
        </DisclosureListItem>
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
      ? `Automatic · ${part.automaticRhythm.style === "swing" ? "Swing" : "Standard"} · ${formatPartLengthBeats(part.automaticRhythm.beats)}`
      : "Automatic";
  }

  if (source.mode === "off") {
    return "Off";
  }

  const option = part.bandModuleOptions[role].find(
    (option) => option.id === source.moduleId,
  );

  return option
    ? [option.label, option.detail].filter(Boolean).join(" · ")
    : "Automatic";
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
