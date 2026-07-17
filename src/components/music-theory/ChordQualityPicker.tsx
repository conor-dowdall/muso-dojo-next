"use client";

import {
  getChordQualityChordCollectionKey,
  type ChordCollectionKey,
  type ChordQuality,
} from "@musodojo/music-theory-data";
import { useState } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  DisclosureList,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import styles from "./ChordQualityPicker.module.css";

interface ChordQualityPickerProps {
  value?: ChordCollectionKey;
  onChange: (value: ChordCollectionKey) => void;
}

interface ChordQualityChoice {
  chordCollectionKey: ChordCollectionKey;
  label: string;
}

function qualityChoice(
  quality: ChordQuality,
  label: string,
): ChordQualityChoice {
  return {
    chordCollectionKey: getChordQualityChordCollectionKey(quality),
    label,
  };
}

export const customProgressionCommonChordChoices = [
  qualityChoice("M", "Major"),
  qualityChoice("m", "Minor"),
  qualityChoice("7", "Dominant 7"),
] as const satisfies readonly ChordQualityChoice[];

export const customProgressionMoreChordChoices = [
  qualityChoice("M7", "Major 7"),
  qualityChoice("m7", "Minor 7"),
  qualityChoice("°", "Diminished"),
  qualityChoice("ø7", "Half-Diminished 7"),
  qualityChoice("°7", "Diminished 7"),
  qualityChoice("+", "Augmented"),
  {
    chordCollectionKey: "augmented7",
    label: "Augmented 7",
  },
  qualityChoice("+M7", "Augmented Major 7"),
] as const satisfies readonly ChordQualityChoice[];

const commonChordKeySet = new Set<ChordCollectionKey>(
  customProgressionCommonChordChoices.map(
    (choice) => choice.chordCollectionKey,
  ),
);

function ChordChoiceGrid({
  choices,
  className,
  value,
  onChange,
}: {
  choices: readonly ChordQualityChoice[];
  className: string;
  value?: ChordCollectionKey;
  onChange: (value: ChordCollectionKey) => void;
}) {
  return (
    <div className={className}>
      {choices.map(({ chordCollectionKey, label }) => (
        <OptionButton
          key={chordCollectionKey}
          aria-label={`Use ${label} chord`}
          className={styles.qualityChoice}
          density="compact"
          label={label}
          presentation="tile"
          selected={value === chordCollectionKey}
          onClick={() => onChange(chordCollectionKey)}
        />
      ))}
    </div>
  );
}

export function ChordQualityPicker({
  value,
  onChange,
}: ChordQualityPickerProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(
    value !== undefined && !commonChordKeySet.has(value),
  );

  return (
    <div className={styles.picker}>
      <ChordChoiceGrid
        choices={customProgressionCommonChordChoices}
        className={styles.commonGrid}
        value={value}
        onChange={(chordCollectionKey) => {
          onChange(chordCollectionKey);
          setIsMoreOpen(false);
        }}
      />
      <DisclosureList density="compact">
        <DisclosureListItem
          ariaLabel="More chord choices"
          isOpen={isMoreOpen}
          label="More Chords"
          panelVariant="menu"
          onToggle={() => setIsMoreOpen((current) => !current)}
        >
          <ChordChoiceGrid
            choices={customProgressionMoreChordChoices}
            className={styles.moreGrid}
            value={value}
            onChange={onChange}
          />
        </DisclosureListItem>
      </DisclosureList>
    </div>
  );
}
