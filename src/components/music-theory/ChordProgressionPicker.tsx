"use client";

import {
  chordProgressionCategoryGroups,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import styles from "./ChordProgressionPicker.module.css";

type ProgressionCategoryGroupChoice = string;

interface ChordProgressionCategoryGroup {
  category: string;
  name: string;
  progressionKeys: readonly ChordProgressionKey[];
}

interface ChordProgressionPickerProps {
  rootNote: RootNote;
  value: ChordProgressionKey;
  onChange: (progressionKey: ChordProgressionKey) => void;
}

const progressionCategoryGroups =
  chordProgressionCategoryGroups as readonly ChordProgressionCategoryGroup[];

function getProgressionCategoryGroupChoice(category: string) {
  return `${category}-progressions`;
}

export function ChordProgressionPicker({
  rootNote,
  value,
  onChange,
}: ChordProgressionPickerProps) {
  const progressionCategoryGroupDisclosure =
    useDisclosureList<ProgressionCategoryGroupChoice>();

  return (
    <DisclosureList grouped groupGap="related">
      {progressionCategoryGroups.map((group) => {
        const groupChoice = getProgressionCategoryGroupChoice(group.category);
        const groupTitle = group.name;
        const groupContainsSelection = group.progressionKeys.includes(value);

        return (
          <DisclosureListItem
            key={groupChoice}
            ariaLabel={`${groupTitle}${groupContainsSelection ? ", contains selected progression" : ""}`}
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
                      <span className={styles.chordSubtitle}>{chordLabel}</span>
                    }
                    onClick={() => {
                      progressionCategoryGroupDisclosure.closeAll();
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
