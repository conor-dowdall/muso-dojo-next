"use client";

import {
  chordProgressionCategoryGroups,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ListMusic } from "lucide-react";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import styles from "./ChordProgressionPicker.module.css";

type ProgressionCategoryGroupChoice = string;

interface ChordProgressionPickerProps {
  customSelected?: boolean;
  onManageCustom: () => void;
  rootNote: RootNote;
  value?: ChordProgressionKey;
  onChange: (progressionKey: ChordProgressionKey) => void;
}

function getProgressionCategoryGroupChoice(category: string) {
  return `${category}-progressions`;
}

export function ChordProgressionPicker({
  customSelected = false,
  onManageCustom,
  rootNote,
  value,
  onChange,
}: ChordProgressionPickerProps) {
  const progressionCategoryGroupDisclosure =
    useDisclosureList<ProgressionCategoryGroupChoice>();

  return (
    <DisclosureList grouped>
      <DisclosureListGroup aria-label="Custom progression library">
        <DisclosureListAction
          icon={<ListMusic />}
          label="Custom Progressions"
          selected={customSelected}
          onClick={onManageCustom}
        />
      </DisclosureListGroup>
      <DisclosureListGroup aria-label="Built-in progressions">
        {chordProgressionCategoryGroups.map((group) => {
          const groupChoice = getProgressionCategoryGroupChoice(group.category);
          const groupTitle = group.name;
          const groupContainsSelection =
            value !== undefined && group.progressionKeys.includes(value);

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
                        <span className={styles.chordSubtitle}>
                          {chordLabel}
                        </span>
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
      </DisclosureListGroup>
    </DisclosureList>
  );
}
