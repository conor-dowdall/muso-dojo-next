"use client";

import {
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import {
  selectableChordProgressionCategoryGroups,
  type SelectableAppChordProgressionKey,
} from "@/utils/music-theory/appChordProgressions";
import styles from "./ChordProgressionPicker.module.css";

type ProgressionCategoryGroupChoice = string;

interface ChordProgressionCategoryGroup {
  category: string;
  name: string;
  progressionKeys: readonly SelectableAppChordProgressionKey[];
}

interface ChordProgressionPickerProps {
  rootNote: RootNote;
  value: SelectableAppChordProgressionKey;
  onChange: (progressionKey: SelectableAppChordProgressionKey) => void;
}

const progressionCategoryGroups =
  selectableChordProgressionCategoryGroups as readonly ChordProgressionCategoryGroup[];

function getProgressionCategoryGroupChoice(category: string) {
  return `${category}-progressions`;
}

function getProgressionCategoryGroupChoiceForProgression(
  progressionKey: SelectableAppChordProgressionKey,
) {
  const group = progressionCategoryGroups.find((candidateGroup) =>
    candidateGroup.progressionKeys.includes(progressionKey),
  );

  return group ? getProgressionCategoryGroupChoice(group.category) : null;
}

export function ChordProgressionPicker({
  rootNote,
  value,
  onChange,
}: ChordProgressionPickerProps) {
  const progressionCategoryGroupDisclosure =
    useDisclosureList<ProgressionCategoryGroupChoice>(
      getProgressionCategoryGroupChoiceForProgression(value),
    );

  return (
    <DisclosureList grouped groupGap="related">
      {progressionCategoryGroups.map((group) => {
        const groupChoice = getProgressionCategoryGroupChoice(group.category);
        const groupTitle = group.name;
        const groupContainsSelection = group.progressionKeys.includes(value);

        return (
          <DisclosureListItem
            key={groupChoice}
            ariaLabel={groupTitle}
            isOpen={
              progressionCategoryGroupDisclosure.openChoice === groupChoice
            }
            keepMounted
            label={groupTitle}
            panelVariant="menu"
            selected={groupContainsSelection}
            onToggle={() =>
              progressionCategoryGroupDisclosure.toggleChoice(groupChoice)
            }
          >
            <DisclosureList>
              {group.progressionKeys.map((candidateKey) => {
                const { chordLabel, titleLabel } =
                  getChordProgressionDisplayLabels(rootNote, candidateKey);

                return (
                  <DisclosureListChoice
                    key={candidateKey}
                    label={titleLabel}
                    selected={value === candidateKey}
                    subtitle={
                      <span className={styles.chordSubtitle} title={chordLabel}>
                        {chordLabel}
                      </span>
                    }
                    onClick={() => {
                      progressionCategoryGroupDisclosure.open(groupChoice);
                      onChange(candidateKey);
                    }}
                  />
                );
              })}
            </DisclosureList>
          </DisclosureListItem>
        );
      })}
    </DisclosureList>
  );
}
