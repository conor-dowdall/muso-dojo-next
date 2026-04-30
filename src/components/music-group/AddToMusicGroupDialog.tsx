"use client";

import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
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
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  DEFAULT_FRETBOARD_THEME,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { DEFAULT_KEYBOARD_RANGE, keyboardRanges } from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import { type AddInstrumentHandler } from "@/types/workspace";
import { AddFretboardToMusicGroupPanel } from "./AddFretboardToMusicGroupPanel";
import {
  AddKeyboardToMusicGroupPanel,
  type KeyboardRangeSelection,
} from "./AddKeyboardToMusicGroupPanel";
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
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

interface FretboardSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  fretRange: readonly [number, number];
  handedness: "right" | "left";
  theme: FretboardThemeName;
}

const defaultKeyboardSelection: KeyboardSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  midiRange: keyboardRanges[DEFAULT_KEYBOARD_RANGE].midiRange,
  theme: DEFAULT_KEYBOARD_THEME,
};

const defaultFretboardSelection: FretboardSelection = {
  instrument: "guitar",
  tuningKey: stringInstruments.guitar.defaultTuning,
  fretRange: [0, 12],
  handedness: "right",
  theme: DEFAULT_FRETBOARD_THEME,
};

export function AddToMusicGroupDialog({
  onAddInstrument,
  onClose,
}: AddToMusicGroupDialogProps) {
  const [selectedItemType, setSelectedItemType] =
    useState<AddableMusicGroupItemType>("keyboard");
  const [keyboardSelection, setKeyboardSelection] = useState<KeyboardSelection>(
    defaultKeyboardSelection,
  );
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardSelection>(defaultFretboardSelection);

  const addLabel =
    selectedItemType === "keyboard" ? "Add Keyboard" : "Add Fretboard";

  const handleAddToMusicGroup = () => {
    if (selectedItemType === "keyboard") {
      onAddInstrument("keyboard", {
        ...(keyboardSelection.range === "custom"
          ? { config: { midiRange: keyboardSelection.midiRange } }
          : { range: keyboardSelection.range }),
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
        fretRange: [...fretboardSelection.fretRange],
        leftHanded: fretboardSelection.handedness === "left",
      },
    });
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Group" onClose={onClose} />
      <DialogContent className={styles.content}>
        <div className={styles.sectionGroup}>
          <section className={styles.section} aria-label="Tool">
            <div className={styles.disclosureList}>
              {addableMusicGroupOptions.map((option) => (
                <OptionButton
                  key={option.id}
                  label={option.title}
                  presentation="list"
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
        </div>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
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
