"use client";

import { type ReactNode } from "react";
import { Drum, Repeat } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { getRhythmChoiceSummary } from "@/components/rhythm/rhythmRecipeControls";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { formatValueSummary } from "@/utils/valueSummary";
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
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PlaybackChoice>(null);
  const automaticRhythmSummary = getRhythmChoiceSummary(
    getRhythmSelectionRecipe(
      getAutomaticRhythmSelection(
        part.automaticRhythm.style,
        part.automaticLengthBeats,
      ),
    ),
  );
  const backingNotesPreview = getSourcePreview(part, "backingNotes");
  const rhythmPreview = getSourcePreview(
    part,
    "rhythm",
    automaticRhythmSummary,
  );

  const chooseSource = (role: PartBandRole, source: PartBandSourceConfig) => {
    part.setBandSource?.(role, source);
    toggleChoice(role);
  };

  return (
    <ObjectMenuDialog
      isOpen={isOpen}
      size="standard"
      title="Backing Band Options"
      onClose={onClose}
    >
      <DisclosureListGroup>
        <BandSourceDisclosure
          icon={<Repeat />}
          isOpen={isChoiceOpen("backingNotes")}
          label="Notes"
          preview={backingNotesPreview}
          role="backingNotes"
          onChoose={chooseSource}
          onToggle={() => toggleChoice("backingNotes")}
        />
        <BandSourceDisclosure
          automaticSubtitle={automaticRhythmSummary}
          icon={<Drum />}
          isOpen={isChoiceOpen("rhythm")}
          label="Rhythm"
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
  automaticRhythmSummary?: string,
) {
  const source = part.band[role];
  if (source.mode === "automatic") {
    return role === "rhythm"
      ? formatValueSummary(["Automatic", automaticRhythmSummary])
      : "Automatic";
  }

  if (source.mode === "off") {
    return "Off";
  }

  const option = part.bandModuleOptions[role].find(
    (option) => option.id === source.moduleId,
  );

  return option
    ? formatValueSummary([option.label, option.detail])
    : "Automatic";
}

function BandSourceDisclosure({
  automaticSubtitle,
  icon,
  isOpen,
  label,
  onChoose,
  onToggle,
  preview,
  role,
}: {
  automaticSubtitle?: string;
  icon: ReactNode;
  isOpen: boolean;
  label: string;
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
      onToggle={onToggle}
    >
      <DisclosureList density="compact">
        <DisclosureListChoice
          label="Automatic"
          selected={source.mode === "automatic"}
          selectedPreviewKind="current"
          subtitle={automaticSubtitle}
          onClick={() => onChoose(role, { mode: "automatic" })}
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
