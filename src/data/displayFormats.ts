import { conversions } from "@musodojo/music-theory-data";
import { type SettingSetter } from "@/types/state";

export const ROOT_AND_NOTE_DISPLAY_FORMAT_IDS = [
  "note-names",
  "intervals",
  "extensions",
  "compound-intervals",
  "triads",
  "seventh-chords",
  "roman-triads",
  "roman-seventh-chords",
] as const;

export type RootAndNoteDisplayFormatId =
  (typeof ROOT_AND_NOTE_DISPLAY_FORMAT_IDS)[number];

export type DisplayFormatId = RootAndNoteDisplayFormatId | "midi" | "none";

export type DisplayFormatSetter = SettingSetter<DisplayFormatId>;

const rootAndNoteDisplayFormatsById = new Map(
  Object.values(conversions.rootAndNoteCollection).map((conversion) => [
    conversion.id as RootAndNoteDisplayFormatId,
    conversion,
  ]),
);

export const displayFormatOptions = [
  ...ROOT_AND_NOTE_DISPLAY_FORMAT_IDS.map((id) => {
    const conversion = rootAndNoteDisplayFormatsById.get(id);
    if (!conversion) {
      throw new Error(`Missing display format definition for ${id}`);
    }

    return {
      id,
      shortLabel: conversion.shortName,
      example: conversion.example,
    };
  }),
  {
    id: "midi" as const,
    shortLabel: "MIDI",
    example: "60, 64, 67",
  },
  {
    id: "none" as const,
    shortLabel: "None",
    example: "Blank",
  },
] as const;

export function isDisplayFormatId(value: unknown): value is DisplayFormatId {
  return (
    typeof value === "string" &&
    displayFormatOptions.some((option) => option.id === value)
  );
}

export function getRootAndNoteDisplayFormat(displayFormatId: DisplayFormatId) {
  if (displayFormatId === "midi" || displayFormatId === "none") {
    return undefined;
  }

  return rootAndNoteDisplayFormatsById.get(displayFormatId);
}

export function getDisplayFormatLabel(
  displayFormatId: DisplayFormatId,
): string {
  return (
    displayFormatOptions.find((option) => option.id === displayFormatId)
      ?.shortLabel ?? "Unknown"
  );
}
