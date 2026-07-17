"use client";

import { type ChordCollectionKey } from "@musodojo/music-theory-data";
import { useState } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  DisclosureList,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  customProgressionCommonChordChoices,
  customProgressionMoreChordChoices,
  type CustomChordProgressionChordChoice,
} from "@/data/customChordProgressionChordQualities";
import styles from "./ChordQualityPicker.module.css";

interface ChordQualityPickerProps {
  value?: ChordCollectionKey;
  onChange: (value: ChordCollectionKey) => void;
}

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
  choices: readonly CustomChordProgressionChordChoice[];
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
