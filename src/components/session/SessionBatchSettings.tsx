"use client";

import { CaseSensitive, Circle, ListMusic } from "lucide-react";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import { DisclosureListItem } from "@/components/ui/disclosure-list/DisclosureList";
import {
  getInstrumentNoteEmphasisLabel,
  InstrumentNoteEmphasisPicker,
} from "@/components/instrument/InstrumentNoteEmphasisPicker";
import {
  getDisplayFormatLabel,
  type DisplayFormatId,
} from "@/data/displayFormats";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  noteCollections,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { type SessionManagementSessionSummary } from "./sessionManagementFormatting";
import { type SessionBatchSettingChoice } from "./sessionManagementTypes";

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

function getSessionNoteCollectionAggregate(
  session: SessionManagementSessionSummary,
) {
  return getUniformAggregate(
    session.parts.map((part) => part.noteCollectionKey),
    (noteCollectionKey) => noteCollections[noteCollectionKey].primaryName,
    "No Parts",
  );
}

function getSessionDisplayFormatAggregate(
  session: SessionManagementSessionSummary,
) {
  return getUniformAggregate(
    session.parts.flatMap((part) =>
      part.instruments.map((instrument) => instrument.displayFormatId),
    ),
    getDisplayFormatLabel,
    "No Instruments",
  );
}

function getSessionNoteEmphasisAggregate(
  session: SessionManagementSessionSummary,
) {
  return getUniformAggregate(
    session.parts.flatMap((part) =>
      part.instruments.map((instrument) => instrument.noteEmphasis),
    ),
    getInstrumentNoteEmphasisLabel,
    "No Instruments",
  );
}

interface SessionBatchSettingsProps {
  openSetting: string | null;
  session: SessionManagementSessionSummary;
  onDisplayFormatIdChange: (
    sessionId: string,
    displayFormatId: DisplayFormatId,
  ) => void;
  onNoteCollectionKeyChange: (
    sessionId: string,
    noteCollectionKey: NoteCollectionKey,
  ) => void;
  onNoteEmphasisChange: (
    sessionId: string,
    noteEmphasis: InstrumentNoteEmphasis,
  ) => void;
  onToggleSetting: (setting: SessionBatchSettingChoice) => void;
}

export function SessionBatchSettings({
  openSetting,
  session,
  onDisplayFormatIdChange,
  onNoteCollectionKeyChange,
  onNoteEmphasisChange,
  onToggleSetting,
}: SessionBatchSettingsProps) {
  const noteCollectionAggregate = getSessionNoteCollectionAggregate(session);
  const displayFormatAggregate = getSessionDisplayFormatAggregate(session);
  const noteEmphasisAggregate = getSessionNoteEmphasisAggregate(session);

  return (
    <>
      <DisclosureListItem
        ariaLabel={`Set chord or scale for all parts in ${session.name}`}
        disabled={noteCollectionAggregate.isDisabled}
        icon={<ListMusic />}
        isOpen={openSetting === "note-collection"}
        keepMounted
        label="Chord or Scale"
        panelVariant="menu"
        preview={noteCollectionAggregate.preview}
        subtitle="All Parts"
        onToggle={() => onToggleSetting("note-collection")}
      >
        <NoteCollectionPicker
          value={noteCollectionAggregate.value}
          onChange={(noteCollectionKey) =>
            onNoteCollectionKeyChange(session.id, noteCollectionKey)
          }
        />
      </DisclosureListItem>

      <DisclosureListItem
        ariaLabel={`Set display text for all instruments in ${session.name}`}
        disabled={displayFormatAggregate.isDisabled}
        icon={<CaseSensitive />}
        isOpen={openSetting === "display-format"}
        keepMounted
        label="Display Text"
        panelVariant="menu"
        preview={displayFormatAggregate.preview}
        subtitle="All Instruments"
        onToggle={() => onToggleSetting("display-format")}
      >
        <DisplayFormatPicker
          value={displayFormatAggregate.value}
          onChange={(displayFormatId) =>
            onDisplayFormatIdChange(session.id, displayFormatId)
          }
        />
      </DisclosureListItem>

      <DisclosureListItem
        ariaLabel={`Set note size for all instruments in ${session.name}`}
        disabled={noteEmphasisAggregate.isDisabled}
        icon={<Circle />}
        isOpen={openSetting === "note-emphasis"}
        keepMounted
        label="Note Size"
        panelVariant="menu"
        preview={noteEmphasisAggregate.preview}
        subtitle="All Instruments"
        onToggle={() => onToggleSetting("note-emphasis")}
      >
        <InstrumentNoteEmphasisPicker
          value={noteEmphasisAggregate.value}
          onChange={(noteEmphasis) =>
            onNoteEmphasisChange(session.id, noteEmphasis)
          }
        />
      </DisclosureListItem>
    </>
  );
}
