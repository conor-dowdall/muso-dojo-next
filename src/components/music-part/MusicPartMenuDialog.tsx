"use client";

import { CaseSensitive, Circle } from "lucide-react";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import {
  getInstrumentNoteEmphasisLabel,
  InstrumentNoteEmphasisPicker,
} from "@/components/instrument/InstrumentNoteEmphasisPicker";
import {
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectManagementGroup,
  ObjectMenuDialog,
} from "@/components/ui/object-menu";
import {
  getDisplayFormatLabel,
  type DisplayFormatId,
} from "@/data/displayFormats";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { useMusicPart } from "./MusicPartContext";

interface MusicPartMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type PartMenuChoice = "display-format" | "note-emphasis";

interface SettingAggregate<T> {
  isDisabled: boolean;
  preview: string;
  value?: T;
}

function getUniformAggregate<T>(
  values: readonly T[],
  getLabel: (value: T) => string,
  emptyLabel: string,
): SettingAggregate<T> {
  if (values.length === 0) {
    return {
      isDisabled: true,
      preview: emptyLabel,
    };
  }

  const [firstValue] = values;
  const isMixed = values.some((value) => value !== firstValue);

  return isMixed
    ? {
        isDisabled: false,
        preview: "Mixed",
      }
    : {
        isDisabled: false,
        preview: getLabel(firstValue),
        value: firstValue,
      };
}

export function MusicPartMenuDialog({
  isOpen,
  onClose,
}: MusicPartMenuDialogProps) {
  const musicPart = useMusicPart();
  const { isOpen: isChoiceOpen, toggleChoice } =
    useDisclosureList<PartMenuChoice>();
  const hasBatchControls = Boolean(
    musicPart.setPartDisplayFormatId || musicPart.setPartNoteEmphasis,
  );
  const displayFormatAggregate = getUniformAggregate<DisplayFormatId>(
    musicPart.instrumentSettings.map(
      (instrument) => instrument.displayFormatId,
    ),
    getDisplayFormatLabel,
    "No Instruments",
  );
  const noteEmphasisAggregate = getUniformAggregate<InstrumentNoteEmphasis>(
    musicPart.instrumentSettings.map((instrument) => instrument.noteEmphasis),
    getInstrumentNoteEmphasisLabel,
    "No Instruments",
  );

  const handleClone = () => {
    musicPart.clonePart?.();
    onClose();
  };

  const handleRemove = () => {
    musicPart.removePart?.();
    onClose();
  };

  return (
    <ObjectMenuDialog isOpen={isOpen} level="part" onClose={onClose}>
      {hasBatchControls ? (
        <DisclosureListGroup>
          {musicPart.setPartDisplayFormatId ? (
            <DisclosureListItem
              ariaLabel="Set display text for all instruments in this part"
              disabled={displayFormatAggregate.isDisabled}
              icon={<CaseSensitive />}
              isOpen={isChoiceOpen("display-format")}
              keepMounted
              label="Display Text"
              panelVariant="menu"
              preview={displayFormatAggregate.preview}
              subtitle="All Instruments"
              onToggle={() => toggleChoice("display-format")}
            >
              <DisplayFormatPicker
                value={displayFormatAggregate.value}
                onChange={musicPart.setPartDisplayFormatId}
              />
            </DisclosureListItem>
          ) : null}

          {musicPart.setPartNoteEmphasis ? (
            <DisclosureListItem
              ariaLabel="Set note size for all instruments in this part"
              disabled={noteEmphasisAggregate.isDisabled}
              icon={<Circle />}
              isOpen={isChoiceOpen("note-emphasis")}
              keepMounted
              label="Note Size"
              panelVariant="menu"
              preview={noteEmphasisAggregate.preview}
              subtitle="All Instruments"
              onToggle={() => toggleChoice("note-emphasis")}
            >
              <InstrumentNoteEmphasisPicker
                value={noteEmphasisAggregate.value}
                onChange={musicPart.setPartNoteEmphasis}
              />
            </DisclosureListItem>
          ) : null}
        </DisclosureListGroup>
      ) : null}

      <ObjectManagementGroup
        level="part"
        onDanger={musicPart.removePart ? handleRemove : undefined}
        onDuplicate={musicPart.clonePart ? handleClone : undefined}
      />
    </ObjectMenuDialog>
  );
}
