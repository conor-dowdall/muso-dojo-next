"use client";

import {
  stringInstrumentTunings,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { ListChevronsUpDown } from "lucide-react";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  formatOpenStringNotes,
  getFretboardTuningGroups,
} from "@/components/instrument-creation/options";

interface FretboardTuningChoicesProps {
  instrument: StringInstrumentKey;
  onManage: () => void;
  onNamedSelect: (tuningKey: StringInstrumentTuningKey) => void;
  tuningKey?: StringInstrumentTuningKey;
}

export function FretboardTuningChoices({
  instrument,
  onManage,
  onNamedSelect,
  tuningKey,
}: FretboardTuningChoicesProps) {
  const tuningGroups = getFretboardTuningGroups(instrument);

  return (
    <DisclosureList grouped>
      <DisclosureListGroup aria-label="Custom tuning library">
        <DisclosureListAction
          icon={<ListChevronsUpDown />}
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
