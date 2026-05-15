"use client";

import {
  chordProgressionBarGroups,
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

type ProgressionBarGroupChoice = string;

interface ChordProgressionBarGroup {
  totalBars: number;
  progressionKeys: readonly ChordProgressionKey[];
}

interface ChordProgressionPickerProps {
  rootNote: RootNote;
  value: ChordProgressionKey;
  onChange: (progressionKey: ChordProgressionKey) => void;
}

const progressionBarGroups =
  chordProgressionBarGroups as readonly ChordProgressionBarGroup[];

function getProgressionBarGroupChoice(totalBars: number) {
  return `${totalBars}-bar-progressions`;
}

function getProgressionBarGroupChoiceForProgression(
  progressionKey: ChordProgressionKey,
) {
  const group = progressionBarGroups.find((candidateGroup) =>
    candidateGroup.progressionKeys.includes(progressionKey),
  );

  return group ? getProgressionBarGroupChoice(group.totalBars) : null;
}

function getProgressionBarGroupTitle(totalBars: number) {
  return `${totalBars}-Bar Progressions`;
}

export function ChordProgressionPicker({
  rootNote,
  value,
  onChange,
}: ChordProgressionPickerProps) {
  const progressionBarGroupDisclosure =
    useDisclosureList<ProgressionBarGroupChoice>(
      getProgressionBarGroupChoiceForProgression(value),
    );

  return (
    <DisclosureList grouped groupGap="related">
      {progressionBarGroups.map((group) => {
        const groupChoice = getProgressionBarGroupChoice(group.totalBars);
        const groupTitle = getProgressionBarGroupTitle(group.totalBars);
        const groupContainsSelection = group.progressionKeys.includes(value);

        return (
          <DisclosureListItem
            key={groupChoice}
            ariaLabel={groupTitle}
            isOpen={progressionBarGroupDisclosure.openChoice === groupChoice}
            keepMounted
            label={groupTitle}
            panelVariant="menu"
            selected={groupContainsSelection}
            onToggle={() =>
              progressionBarGroupDisclosure.toggleChoice(groupChoice)
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
                      progressionBarGroupDisclosure.open(groupChoice);
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
