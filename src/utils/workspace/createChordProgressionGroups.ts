import {
  chordProgressionTemplates,
  getNoteNamesForRootAndIntervals,
  normalizeRootNoteString,
  type ChordProgressionTemplateKey,
  type Interval,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import {
  createDefaultInstrumentConfig,
  createEntityId,
} from "@/utils/workspace/createWorkspaceEntities";
import { normalizeMusicGroupConfig } from "@/utils/workspace/createWorkspaceConfig";
import {
  type InstrumentCreationConfig,
  type InstrumentType,
  type MusicGroupConfig,
} from "@/types/workspace";

type ChordProgressionTemplate =
  (typeof chordProgressionTemplates)[ChordProgressionTemplateKey];
interface ChordProgressionTemplateStep {
  interval: Interval;
  noteCollectionKey: NoteCollectionKey;
}

interface ChordProgressionTemplateSection {
  chords: readonly ChordProgressionTemplateStep[];
}

interface CreateChordProgressionGroupsOptions {
  rootNote: string;
  templateKey: ChordProgressionTemplateKey;
  sectionIndex?: number;
  instrumentType: InstrumentType;
  instrumentSettings: InstrumentCreationConfig;
}

function createProgressionGroupId(
  templateKey: ChordProgressionTemplateKey,
  index: number,
) {
  return createEntityId(`group-${templateKey}-${index + 1}`);
}

function getTemplateSection(
  template: ChordProgressionTemplate,
  sectionIndex: number,
) {
  const sections =
    template.sections as readonly ChordProgressionTemplateSection[];

  return sections[sectionIndex] ?? sections[0];
}

function createGroupFromStep({
  groupId,
  instrumentSettings,
  instrumentType,
  rootNote,
  step,
}: {
  groupId: string;
  instrumentSettings: InstrumentCreationConfig;
  instrumentType: InstrumentType;
  rootNote: string;
  step: ChordProgressionTemplateStep;
}): MusicGroupConfig {
  const group = normalizeMusicGroupConfig({
    id: groupId,
    rootNote,
    noteCollectionKey: step.noteCollectionKey,
    instruments: [
      createDefaultInstrumentConfig(instrumentType, instrumentSettings),
    ],
  });

  if (!group) {
    throw new Error("Unable to create chord progression group");
  }

  return group;
}

export function createChordProgressionGroups({
  rootNote,
  templateKey,
  sectionIndex = 0,
  instrumentType,
  instrumentSettings,
}: CreateChordProgressionGroupsOptions): MusicGroupConfig[] {
  const template = chordProgressionTemplates[templateKey];
  const section = getTemplateSection(template, sectionIndex);
  const steps = section?.chords ?? [];
  const normalizedRootNote = normalizeRootNoteString(rootNote) ?? "C";
  const chordRootNotes = getNoteNamesForRootAndIntervals(
    normalizedRootNote,
    steps.map((step) => step.interval),
  );

  return steps.map((step, index) =>
    createGroupFromStep({
      groupId: createProgressionGroupId(templateKey, index),
      instrumentSettings,
      instrumentType,
      rootNote: chordRootNotes[index] ?? normalizedRootNote,
      step,
    }),
  );
}
