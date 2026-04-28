"use client";

import {
  type CSSProperties,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  stringInstrumentTunings,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { Heading } from "@/components/ui/typography/Heading";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Text } from "@/components/ui/typography/Text";
import {
  DEFAULT_FRETBOARD_THEME,
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  DEFAULT_KEYBOARD_RANGE,
  keyboardRanges,
  type KeyboardRangeName,
} from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  keyboardThemes,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import { type AddInstrumentHandler } from "@/types/workspace";
import { AddFretboardToMusicGroupPanel } from "./AddFretboardToMusicGroupPanel";
import { AddKeyboardToMusicGroupPanel } from "./AddKeyboardToMusicGroupPanel";
import {
  addableMusicGroupOptions,
  type AddableMusicGroupItemType,
} from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

interface AddToMusicGroupDialogProps {
  onAddInstrument: AddInstrumentHandler;
  onClose: () => void;
}

interface KeyboardSelection {
  range: KeyboardRangeName;
  theme: KeyboardThemeName;
}

interface FretboardSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  theme: FretboardThemeName;
}

const defaultKeyboardSelection: KeyboardSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  theme: DEFAULT_KEYBOARD_THEME,
};

const defaultFretboardSelection: FretboardSelection = {
  instrument: "guitar",
  tuningKey: stringInstruments.guitar.defaultTuning,
  theme: DEFAULT_FRETBOARD_THEME,
};

export function AddToMusicGroupDialog({
  onAddInstrument,
  onClose,
}: AddToMusicGroupDialogProps) {
  const itemTypeHeadingId = useId();
  const [selectedItemType, setSelectedItemType] =
    useState<AddableMusicGroupItemType>("keyboard");
  const [keyboardSelection, setKeyboardSelection] = useState<KeyboardSelection>(
    defaultKeyboardSelection,
  );
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardSelection>(defaultFretboardSelection);

  const selectedSummary =
    selectedItemType === "keyboard"
      ? getKeyboardSelectionSummary(keyboardSelection)
      : getFretboardSelectionSummary(fretboardSelection);
  const addLabel =
    selectedItemType === "keyboard" ? "Add keyboard" : "Add fretboard";

  const handleAddToMusicGroup = () => {
    if (selectedItemType === "keyboard") {
      onAddInstrument("keyboard", {
        range: keyboardSelection.range,
        theme: keyboardSelection.theme,
      });
      onClose();
      return;
    }

    onAddInstrument("fretboard", {
      theme: fretboardSelection.theme,
      config: {
        instrument: fretboardSelection.instrument,
        tuningKey: fretboardSelection.tuningKey,
      },
    });
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Group" onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-labelledby={itemTypeHeadingId}>
          <div className={styles.sectionHeader}>
            <Heading as="h3" id={itemTypeHeadingId} size="sm" weight="semibold">
              Tool
            </Heading>
          </div>

          <div className={styles.optionGrid}>
            {addableMusicGroupOptions.map((option) => (
              <OptionButton
                key={option.id}
                label={option.title}
                presentation="tile"
                selected={selectedItemType === option.id}
                onClick={() => setSelectedItemType(option.id)}
              />
            ))}
          </div>
        </section>

        <AnimatedDetailPanel animationKey={selectedItemType}>
          {selectedItemType === "keyboard" ? (
            <AddKeyboardToMusicGroupPanel
              value={keyboardSelection}
              onChange={setKeyboardSelection}
            />
          ) : (
            <AddFretboardToMusicGroupPanel
              value={fretboardSelection}
              onChange={setFretboardSelection}
            />
          )}
        </AnimatedDetailPanel>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <div className={styles.summaryCopy}>
            <Text as="p" size="sm">
              {selectedSummary}
            </Text>
          </div>
          <Button
            label={addLabel}
            size="lg"
            variant="filled"
            onClick={handleAddToMusicGroup}
          />
        </section>
      </DialogFooter>
    </>
  );
}

function AnimatedDetailPanel({
  animationKey,
  children,
}: {
  animationKey: AddableMusicGroupItemType;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const updateHeight = () => {
      setHeight(panel.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [animationKey]);

  return (
    <div
      className={styles.detailPanelFrame}
      style={
        height === undefined
          ? undefined
          : ({
              "--detail-panel-height": `${height}px`,
            } as CSSProperties)
      }
    >
      <div key={animationKey} ref={panelRef} className={styles.detailPanel}>
        {children}
      </div>
    </div>
  );
}

function getKeyboardSelectionSummary({ range, theme }: KeyboardSelection) {
  return `${keyboardRanges[range].title} keyboard, ${keyboardThemes[theme].title} look`;
}

function getFretboardSelectionSummary({
  instrument,
  theme,
  tuningKey,
}: FretboardSelection) {
  return `${stringInstruments[instrument].primaryName}, ${stringInstrumentTunings[tuningKey].primaryName} tuning, ${fretboardThemes[theme].title} look`;
}
