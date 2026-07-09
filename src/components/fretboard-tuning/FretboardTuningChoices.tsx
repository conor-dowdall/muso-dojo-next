"use client";

import {
  formatMidiNote,
  stringInstrumentTunings,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { LibraryBig } from "lucide-react";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { useAppStore } from "@/stores/appStore";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import {
  fretboardToConventionalTuning,
  tuningNotesAreEqual,
} from "@/utils/fretboard/customFretboardTunings";
import {
  formatOpenStringNotes,
  getFretboardTuningGroups,
} from "@/components/instrument-creation/options";

interface FretboardTuningChoicesProps {
  instrument: StringInstrumentKey;
  onCustomSelect: (tuning: SavedFretboardTuning) => void;
  onManage: () => void;
  onNamedSelect: (tuningKey: StringInstrumentTuningKey) => void;
  tuning?: readonly number[];
  tuningKey?: StringInstrumentTuningKey;
  tuningName?: string;
}

export function formatCustomOpenStringNotes(openMidiNotes: readonly number[]) {
  return openMidiNotes.map((note) => formatMidiNote(note)).join(" ");
}

export function FretboardTuningChoices({
  instrument,
  onCustomSelect,
  onManage,
  onNamedSelect,
  tuning,
  tuningKey,
  tuningName,
}: FretboardTuningChoicesProps) {
  const allCustomTunings = useAppStore(
    (state) => state.dojoSettings.customFretboardTunings,
  );
  const customTunings = (allCustomTunings ?? [])
    .filter((candidate) => candidate.instrument === instrument)
    .sort((left, right) => left.name.localeCompare(right.name));
  const selectedOpenMidiNotes = tuning
    ? fretboardToConventionalTuning(tuning)
    : undefined;
  const tuningGroups = getFretboardTuningGroups(instrument);

  return (
    <DisclosureList grouped>
      <DisclosureListGroup aria-label="Custom tunings">
        {customTunings.map((customTuning) => (
          <DisclosureListChoice
            key={customTuning.id}
            label={customTuning.name}
            subtitle={formatCustomOpenStringNotes(customTuning.openMidiNotes)}
            selected={
              tuningKey === undefined &&
              tuningName === customTuning.name &&
              tuningNotesAreEqual(
                selectedOpenMidiNotes,
                customTuning.openMidiNotes,
              )
            }
            onClick={() => onCustomSelect(customTuning)}
          />
        ))}
        <DisclosureListAction
          icon={<LibraryBig />}
          label="Custom Tunings"
          onClick={onManage}
        />
      </DisclosureListGroup>

      {tuningGroups.map((group, index) => (
        <DisclosureListGroup key={group.title ?? `tuning-group-${index}`}>
          {group.tuningKeys.map((candidateTuningKey) => {
            const namedTuning = stringInstrumentTunings[candidateTuningKey];

            return (
              <DisclosureListChoice
                key={candidateTuningKey}
                label={namedTuning.primaryName}
                subtitle={formatOpenStringNotes(namedTuning)}
                selected={tuningKey === candidateTuningKey}
                onClick={() => onNamedSelect(candidateTuningKey)}
              />
            );
          })}
        </DisclosureListGroup>
      ))}
    </DisclosureList>
  );
}
