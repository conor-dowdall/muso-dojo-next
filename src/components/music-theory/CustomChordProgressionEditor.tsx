"use client";

import {
  chordProgression,
  noteCollections,
  type ChordCollectionKey,
  type ChordProgression,
  type ChordProgressionDegree,
} from "@musodojo/music-theory-data";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { type SyntheticEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListItem,
  DisclosureListPanelActions,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NamedLibraryItemSaveField } from "@/components/ui/named-library-item/NamedLibraryItemSaveField";
import { Text } from "@/components/ui/typography/Text";
import {
  ChordQualityPicker,
  getChordQualityDisplayName,
} from "./ChordQualityPicker";
import {
  CUSTOM_CHORD_PROGRESSION_MAX_BARS,
  CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR,
  createCustomProgressionBars,
  createCustomProgressionFromBars,
  customChordProgressionFlatDegrees,
  customChordProgressionSharpDegrees,
  normalizeCustomChordProgressionName,
  type CustomChordProgressionDraftBar,
} from "@/utils/music-theory/customChordProgressions";
import styles from "./CustomChordProgressionEditor.module.css";

interface CustomChordProgressionEditorProps {
  initialName?: string;
  initialProgression?: ChordProgression;
  isNameAvailable?: (name: string) => boolean;
  onSave: (name: string, progression: ChordProgression) => void;
}

interface SelectedChord {
  barIndex: number;
  chordIndex: number;
}

type DegreeSpelling = "flat" | "sharp";

const tonicBar = {
  chords: [{ chordCollectionKey: "major", degree: "1" }],
} satisfies CustomChordProgressionDraftBar;

function cloneBars(bars: readonly CustomChordProgressionDraftBar[]) {
  return bars.map((bar) => ({
    chords: bar.chords.map((chord) => ({ ...chord })),
  }));
}

function getInitialBars(progression: ChordProgression | undefined) {
  return progression
    ? cloneBars(createCustomProgressionBars(progression) ?? [])
    : [];
}

function barsAreEqual(
  left: readonly CustomChordProgressionDraftBar[],
  right: readonly CustomChordProgressionDraftBar[],
) {
  return (
    left.length === right.length &&
    left.every(
      (bar, barIndex) =>
        bar.chords.length === right[barIndex]?.chords.length &&
        bar.chords.every((chord, chordIndex) => {
          const candidate = right[barIndex]?.chords[chordIndex];
          return (
            chord.degree === candidate?.degree &&
            chord.chordCollectionKey === candidate.chordCollectionKey
          );
        }),
    )
  );
}

function getChordRomanSymbol(
  degree: ChordProgressionDegree,
  chordCollectionKey: ChordCollectionKey,
) {
  return (
    chordProgression.getDirectRomanSymbols({
      chords: [{ chordCollectionKey, degree, durationInBars: 1 }],
    })[0] ?? degree
  );
}

function getChordQualityLabel(chordCollectionKey: ChordCollectionKey) {
  const collection = noteCollections[chordCollectionKey];

  return collection.category === "chord"
    ? getChordQualityDisplayName(collection)
    : chordCollectionKey;
}

function getBarDivisionLabel(chordCount: number) {
  switch (chordCount) {
    case 1:
      return "Whole Bar";
    case 2:
      return "Halves";
    case 3:
      return "Thirds";
    case 4:
      return "Quarters";
    default:
      return "";
  }
}

function getDegreeOptions(spelling: DegreeSpelling) {
  return spelling === "flat"
    ? customChordProgressionFlatDegrees
    : customChordProgressionSharpDegrees;
}

function getDegreeChromaticIndex(degree: ChordProgressionDegree) {
  const flatIndex = customChordProgressionFlatDegrees.indexOf(degree);
  return flatIndex >= 0
    ? flatIndex
    : customChordProgressionSharpDegrees.indexOf(degree);
}

export function CustomChordProgressionEditor({
  initialName = "",
  initialProgression,
  isNameAvailable = () => true,
  onSave,
}: CustomChordProgressionEditorProps) {
  const [initialBars] = useState(() => getInitialBars(initialProgression));
  const [name, setName] = useState(initialName);
  const [bars, setBars] = useState(() => cloneBars(initialBars));
  const [selectedChord, setSelectedChord] = useState<SelectedChord | null>(
    null,
  );
  const [openBarActions, setOpenBarActions] = useState<number | null>(null);
  const [degreeSpelling, setDegreeSpelling] = useState<DegreeSpelling>("flat");
  const submissionPendingRef = useRef(false);
  const [submissionPending, setSubmissionPending] = useState(false);
  const chordDisclosure = useDisclosureList<"degree" | "quality">();
  const progression = useMemo(
    () => createCustomProgressionFromBars(bars),
    [bars],
  );
  const normalizedName = normalizeCustomChordProgressionName(name);
  const normalizedInitialName =
    normalizeCustomChordProgressionName(initialName);
  const hasNameConflict =
    normalizedName !== undefined && !isNameAvailable(normalizedName);
  const hasChanges =
    normalizedName !== normalizedInitialName ||
    !barsAreEqual(bars, initialBars);
  const canSave =
    normalizedName !== undefined &&
    !hasNameConflict &&
    progression !== undefined &&
    (initialProgression === undefined || hasChanges);

  const updateChord = (
    barIndex: number,
    chordIndex: number,
    patch: Partial<CustomChordProgressionDraftBar["chords"][number]>,
  ) => {
    setBars((currentBars) =>
      currentBars.map((bar, candidateBarIndex) =>
        candidateBarIndex === barIndex
          ? {
              chords: bar.chords.map((chord, candidateChordIndex) =>
                candidateChordIndex === chordIndex
                  ? { ...chord, ...patch }
                  : chord,
              ),
            }
          : bar,
      ),
    );
  };

  const addBar = () => {
    const barIndex = bars.length;
    setBars((current) => [...current, cloneBars([tonicBar])[0]!]);
    setOpenBarActions(null);
    chordDisclosure.closeAll();
    setSelectedChord({ barIndex, chordIndex: 0 });
  };

  const selectChord = (
    chord: CustomChordProgressionDraftBar["chords"][number],
    barIndex: number,
    chordIndex: number,
    selected: boolean,
  ) => {
    setOpenBarActions(null);
    chordDisclosure.closeAll();

    if (chord.degree.startsWith("♯")) {
      setDegreeSpelling("sharp");
    } else if (chord.degree.startsWith("♭")) {
      setDegreeSpelling("flat");
    }

    setSelectedChord(selected ? null : { barIndex, chordIndex });
  };

  const changeDegreeSpelling = (
    spelling: DegreeSpelling,
    barIndex: number,
    chordIndex: number,
    currentDegree: ChordProgressionDegree,
  ) => {
    setDegreeSpelling(spelling);
    const degreeIndex = getDegreeChromaticIndex(currentDegree);
    const nextDegree = getDegreeOptions(spelling)[degreeIndex];

    if (nextDegree && nextDegree !== currentDegree) {
      updateChord(barIndex, chordIndex, { degree: nextDegree });
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      submissionPendingRef.current ||
      !canSave ||
      !normalizedName ||
      !progression
    ) {
      return;
    }

    submissionPendingRef.current = true;
    setSubmissionPending(true);
    try {
      onSave(normalizedName, progression);
    } catch (error) {
      submissionPendingRef.current = false;
      setSubmissionPending(false);
      throw error;
    }
  };

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      {bars.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size="sm" variant="muted">
            Bars define chord proportions. Rhythm determines the beats.
          </Text>
          <Button
            icon={<Plus />}
            label="Add First Bar"
            size="sm"
            onClick={addBar}
          />
        </div>
      ) : (
        <>
          <div className={styles.barList}>
            {bars.map((bar, barIndex) => {
              const isBarActionsOpen = openBarActions === barIndex;

              return (
                <section className={styles.bar} key={`bar-${barIndex}`}>
                  <div className={styles.barHeader}>
                    <span className={styles.barIdentity}>
                      <span className={styles.barNumber}>
                        Bar {barIndex + 1}
                      </span>
                      <span className={styles.barDivision}>
                        {getBarDivisionLabel(bar.chords.length)}
                      </span>
                    </span>
                    <IconButton
                      aria-label={`${isBarActionsOpen ? "Close" : "Open"} actions for bar ${barIndex + 1}`}
                      icon={<MoreHorizontal />}
                      selected={isBarActionsOpen}
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedChord(null);
                        chordDisclosure.closeAll();
                        setOpenBarActions((current) =>
                          current === barIndex ? null : barIndex,
                        );
                      }}
                    />
                  </div>

                  <div className={styles.chordRow}>
                    {bar.chords.map((chord, chordIndex) => {
                      const selected =
                        selectedChord?.barIndex === barIndex &&
                        selectedChord.chordIndex === chordIndex;

                      return (
                        <OptionButton
                          key={`chord-${chordIndex}`}
                          className={styles.chordButton}
                          density="compact"
                          label={getChordRomanSymbol(
                            chord.degree,
                            chord.chordCollectionKey,
                          )}
                          presentation="tile"
                          selected={selected}
                          onClick={() =>
                            selectChord(chord, barIndex, chordIndex, selected)
                          }
                        />
                      );
                    })}
                  </div>

                  {isBarActionsOpen ? (
                    <DisclosureList density="compact">
                      <DisclosureListAction
                        disabled={barIndex === 0}
                        icon={<ArrowUp />}
                        label="Move Earlier"
                        onClick={() => {
                          setBars((current) => {
                            const next = [...current];
                            [next[barIndex - 1], next[barIndex]] = [
                              next[barIndex]!,
                              next[barIndex - 1]!,
                            ];
                            return next;
                          });
                          setOpenBarActions(null);
                        }}
                      />
                      <DisclosureListAction
                        disabled={barIndex === bars.length - 1}
                        icon={<ArrowDown />}
                        label="Move Later"
                        onClick={() => {
                          setBars((current) => {
                            const next = [...current];
                            [next[barIndex], next[barIndex + 1]] = [
                              next[barIndex + 1]!,
                              next[barIndex]!,
                            ];
                            return next;
                          });
                          setOpenBarActions(null);
                        }}
                      />
                      <DisclosureListAction
                        disabled={
                          bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS
                        }
                        icon={<Copy />}
                        label="Duplicate Bar"
                        onClick={() => {
                          setBars((current) => [
                            ...current.slice(0, barIndex + 1),
                            ...cloneBars([current[barIndex]!]),
                            ...current.slice(barIndex + 1),
                          ]);
                          setOpenBarActions(null);
                        }}
                      />
                      <DisclosureListAction
                        icon={<Trash2 />}
                        label="Remove Bar"
                        tone="danger"
                        onClick={() => {
                          setBars((current) =>
                            current.filter((_, index) => index !== barIndex),
                          );
                          setSelectedChord(null);
                          setOpenBarActions(null);
                        }}
                      />
                    </DisclosureList>
                  ) : null}

                  {selectedChord?.barIndex === barIndex
                    ? (() => {
                        const chordIndex = selectedChord.chordIndex;
                        const chord = bar.chords[chordIndex];
                        if (!chord) return null;
                        const qualityLabel = getChordQualityLabel(
                          chord.chordCollectionKey,
                        );

                        return (
                          <div className={styles.chordEditor}>
                            <DisclosureList>
                              <DisclosureListItem
                                ariaLabel={`Choose degree, ${chord.degree} selected`}
                                isOpen={chordDisclosure.openChoice === "degree"}
                                keepMounted
                                label="Degree"
                                preview={chord.degree}
                                onToggle={() =>
                                  chordDisclosure.toggleChoice("degree")
                                }
                              >
                                <div className={styles.spellingGrid}>
                                  {(["flat", "sharp"] as const).map(
                                    (spelling) => (
                                      <OptionButton
                                        key={spelling}
                                        density="compact"
                                        label={
                                          spelling === "flat"
                                            ? "♭ Flats"
                                            : "♯ Sharps"
                                        }
                                        presentation="tile"
                                        selected={degreeSpelling === spelling}
                                        onClick={() =>
                                          changeDegreeSpelling(
                                            spelling,
                                            barIndex,
                                            chordIndex,
                                            chord.degree,
                                          )
                                        }
                                      />
                                    ),
                                  )}
                                </div>
                                <div
                                  className={`${choiceGridStyles.tokenGrid} ${styles.degreeGrid}`}
                                >
                                  {getDegreeOptions(degreeSpelling).map(
                                    (degree) => (
                                      <OptionButton
                                        key={degree}
                                        className={choiceGridStyles.tokenChoice}
                                        fullWidth={false}
                                        label={degree}
                                        presentation="tile"
                                        selected={chord.degree === degree}
                                        onClick={() => {
                                          updateChord(barIndex, chordIndex, {
                                            degree,
                                          });
                                          chordDisclosure.closeChoice("degree");
                                        }}
                                      />
                                    ),
                                  )}
                                </div>
                              </DisclosureListItem>
                              <DisclosureListItem
                                ariaLabel={`Choose chord quality, ${qualityLabel} selected`}
                                isOpen={
                                  chordDisclosure.openChoice === "quality"
                                }
                                keepMounted
                                label="Chord Quality"
                                preview={qualityLabel}
                                onToggle={() =>
                                  chordDisclosure.toggleChoice("quality")
                                }
                              >
                                <ChordQualityPicker
                                  value={chord.chordCollectionKey}
                                  onChange={(chordCollectionKey) => {
                                    updateChord(barIndex, chordIndex, {
                                      chordCollectionKey,
                                    });
                                    chordDisclosure.closeChoice("quality");
                                  }}
                                />
                              </DisclosureListItem>
                            </DisclosureList>
                            <DisclosureListPanelActions align="stretch">
                              <Button
                                disabled={
                                  bar.chords.length >=
                                  CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR
                                }
                                label="Insert Chord After"
                                size="sm"
                                onClick={() => {
                                  setBars((current) =>
                                    current.map(
                                      (candidateBar, candidateBarIndex) =>
                                        candidateBarIndex === barIndex
                                          ? {
                                              chords: [
                                                ...candidateBar.chords.slice(
                                                  0,
                                                  chordIndex + 1,
                                                ),
                                                { ...chord },
                                                ...candidateBar.chords.slice(
                                                  chordIndex + 1,
                                                ),
                                              ],
                                            }
                                          : candidateBar,
                                    ),
                                  );
                                  setSelectedChord({
                                    barIndex,
                                    chordIndex: chordIndex + 1,
                                  });
                                }}
                              />
                              <Button
                                disabled={bar.chords.length === 1}
                                label="Remove Chord"
                                size="sm"
                                tone="danger"
                                onClick={() => {
                                  setBars((current) =>
                                    current.map(
                                      (candidateBar, candidateBarIndex) =>
                                        candidateBarIndex === barIndex
                                          ? {
                                              chords:
                                                candidateBar.chords.filter(
                                                  (_, index) =>
                                                    index !== chordIndex,
                                                ),
                                            }
                                          : candidateBar,
                                    ),
                                  );
                                  setSelectedChord(null);
                                }}
                              />
                              <Button
                                label="Done"
                                size="sm"
                                onClick={() => setSelectedChord(null)}
                              />
                            </DisclosureListPanelActions>
                          </div>
                        );
                      })()
                    : null}
                </section>
              );
            })}
          </div>

          <div className={styles.addBarAction}>
            <Button
              disabled={bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS}
              icon={<Plus />}
              label="Add Bar"
              size="sm"
              onClick={addBar}
            />
          </div>
        </>
      )}

      <NamedLibraryItemSaveField
        disabled={!canSave || submissionPending}
        errorMessage={
          hasNameConflict ? "That name is already in use." : undefined
        }
        label="Progression Name"
        saveAriaLabel="Save progression"
        value={name}
        onChange={setName}
      />
    </form>
  );
}
