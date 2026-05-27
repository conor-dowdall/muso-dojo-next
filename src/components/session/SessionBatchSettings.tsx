"use client";

import { type ReactNode } from "react";
import {
  CaseSensitive,
  Circle,
  CircleDot,
  CircleOff,
  ListMusic,
} from "lucide-react";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import { DisplayFormatPicker } from "@/components/music-theory/DisplayFormatPicker";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { DisclosureListItem } from "@/components/ui/disclosure-list/DisclosureList";
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
import styles from "./SessionManagementDialog.module.css";

interface SettingAggregate<T> {
  isDisabled: boolean;
  preview: string;
  value?: T;
}

const noteEmphasisOptions = [
  {
    id: "large",
    label: "Large",
    icon: <Circle />,
  },
  {
    id: "small",
    label: "Small",
    icon: <CircleDot />,
  },
  {
    id: "hidden",
    label: "Hidden",
    icon: <CircleOff />,
  },
] as const satisfies readonly {
  icon: ReactNode;
  id: InstrumentNoteEmphasis;
  label: string;
}[];

const noteEmphasisLabels = Object.fromEntries(
  noteEmphasisOptions.map((option) => [option.id, option.label]),
) as Record<InstrumentNoteEmphasis, string>;

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
    (noteEmphasis) => noteEmphasisLabels[noteEmphasis],
    "No Instruments",
  );
}

function NoteEmphasisPicker({
  value,
  onChange,
}: {
  value?: InstrumentNoteEmphasis;
  onChange: (noteEmphasis: InstrumentNoteEmphasis) => void;
}) {
  return (
    <div className={styles.noteEmphasisGrid}>
      {noteEmphasisOptions.map((option) => (
        <OptionButton
          key={option.id}
          density="compact"
          icon={option.icon}
          label={option.label}
          presentation="tile"
          selected={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
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
        <NoteEmphasisPicker
          value={noteEmphasisAggregate.value}
          onChange={(noteEmphasis) =>
            onNoteEmphasisChange(session.id, noteEmphasis)
          }
        />
      </DisclosureListItem>
    </>
  );
}
