"use client";

import {
  chordProgression,
  getNoteNamesForRootAndIntervals,
  rootAndNoteCollection,
  type ChordCollectionKey,
  type ChordProgression,
  type ChordProgressionDegree,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { type SyntheticEvent, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListItem,
  DisclosureListPanelActions,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ChordCollectionPicker } from "./ChordCollectionPicker";
import {
  CUSTOM_CHORD_PROGRESSION_MAX_BARS,
  CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR,
  createCustomProgressionBars,
  createCustomProgressionFromBars,
  customChordProgressionDegrees,
  normalizeCustomChordProgressionName,
  type CustomChordProgressionDraftBar,
} from "@/utils/music-theory/customChordProgressions";
import styles from "./CustomChordProgressionEditor.module.css";

interface CustomChordProgressionEditorProps {
  initialName?: string;
  initialProgression: ChordProgression;
  isNameAvailable?: (name: string) => boolean;
  rootNote: RootNote;
  onSave: (name: string, progression: ChordProgression) => void;
}

interface SelectedChord {
  barIndex: number;
  chordIndex: number;
}

const tonicBar = {
  chords: [{ chordCollectionKey: "major", degree: "1" }],
} satisfies CustomChordProgressionDraftBar;

function cloneBars(bars: readonly CustomChordProgressionDraftBar[]) {
  return bars.map((bar) => ({
    chords: bar.chords.map((chord) => ({ ...chord })),
  }));
}

function getInitialBars(progression: ChordProgression) {
  return cloneBars(createCustomProgressionBars(progression) ?? [tonicBar]);
}

function getResolvedRoot(rootNote: RootNote, degree: ChordProgressionDegree) {
  return getNoteNamesForRootAndIntervals(rootNote, [degree])[0] ?? rootNote;
}

function getChordLabels(
  rootNote: RootNote,
  degree: ChordProgressionDegree,
  chordCollectionKey: ChordCollectionKey,
) {
  const resolvedRoot = getResolvedRoot(rootNote, degree);
  const identity = rootAndNoteCollection.getIdentity({
    rootNote: resolvedRoot,
    noteCollectionKey: chordCollectionKey,
  });
  const romanSymbol = chordProgression.getDirectRomanSymbols({
    chords: [{ chordCollectionKey, degree, durationInBars: 1 }],
  })[0];

  return {
    chordLabel: identity.label,
    chordTypeLabel: identity.collectionName,
    romanSymbol,
    rootLabel: resolvedRoot,
  };
}

export function CustomChordProgressionEditor({
  initialName = "",
  initialProgression,
  isNameAvailable = () => true,
  rootNote,
  onSave,
}: CustomChordProgressionEditorProps) {
  const nameInputId = useId();
  const [name, setName] = useState(initialName);
  const [bars, setBars] = useState(() => getInitialBars(initialProgression));
  const [selectedChord, setSelectedChord] = useState<SelectedChord | null>(
    null,
  );
  const [openBarActions, setOpenBarActions] = useState<number | null>(null);
  const submissionPendingRef = useRef(false);
  const [submissionPending, setSubmissionPending] = useState(false);
  const chordDisclosure = useDisclosureList<"root" | "type">();
  const progression = useMemo(
    () => createCustomProgressionFromBars(bars),
    [bars],
  );
  const normalizedName = normalizeCustomChordProgressionName(name);
  const hasNameConflict =
    normalizedName !== undefined && !isNameAvailable(normalizedName);
  const canSave =
    normalizedName !== undefined &&
    !hasNameConflict &&
    progression !== undefined;

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
      <label className={styles.nameField} htmlFor={nameInputId}>
        <span className={styles.nameLabel}>Progression Name</span>
        <input
          autoComplete="off"
          className={`${fieldStyles.surface} ${fieldStyles.text} ${styles.nameInput}`}
          id={nameInputId}
          placeholder="Progression Name"
          spellCheck={false}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        {hasNameConflict ? (
          <span className={styles.message}>That name is already in use.</span>
        ) : null}
      </label>

      <div className={styles.barList}>
        {bars.map((bar, barIndex) => {
          const isBarActionsOpen = openBarActions === barIndex;

          return (
            <section className={styles.bar} key={`bar-${barIndex}`}>
              <div className={styles.barHeader}>
                <span className={styles.barNumber}>Bar {barIndex + 1}</span>
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
                  const labels = getChordLabels(
                    rootNote,
                    chord.degree,
                    chord.chordCollectionKey,
                  );
                  const selected =
                    selectedChord?.barIndex === barIndex &&
                    selectedChord.chordIndex === chordIndex;

                  return (
                    <OptionButton
                      key={`chord-${chordIndex}`}
                      className={styles.chordButton}
                      density="compact"
                      label={labels.chordLabel}
                      presentation="tile"
                      selected={selected}
                      subtitle={labels.romanSymbol}
                      onClick={() => {
                        setOpenBarActions(null);
                        chordDisclosure.closeAll();
                        setSelectedChord(
                          selected ? null : { barIndex, chordIndex },
                        );
                      }}
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
                    disabled={bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS}
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
                    disabled={bars.length === 1}
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
                    const labels = getChordLabels(
                      rootNote,
                      chord.degree,
                      chord.chordCollectionKey,
                    );

                    return (
                      <div className={styles.chordEditor}>
                        <DisclosureList>
                          <DisclosureListItem
                            ariaLabel={`Choose chord root, ${labels.rootLabel} selected`}
                            isOpen={chordDisclosure.openChoice === "root"}
                            keepMounted
                            label="Root"
                            preview={labels.rootLabel}
                            onToggle={() =>
                              chordDisclosure.toggleChoice("root")
                            }
                          >
                            <div
                              className={`${choiceGridStyles.tokenGrid} ${styles.rootGrid}`}
                            >
                              {customChordProgressionDegrees.map((degree) => {
                                const resolvedRoot = getResolvedRoot(
                                  rootNote,
                                  degree,
                                );
                                return (
                                  <OptionButton
                                    key={degree}
                                    className={choiceGridStyles.tokenChoice}
                                    fullWidth={false}
                                    label={resolvedRoot}
                                    presentation="tile"
                                    selected={chord.degree === degree}
                                    subtitle={degree}
                                    onClick={() => {
                                      updateChord(barIndex, chordIndex, {
                                        degree,
                                      });
                                      chordDisclosure.closeChoice("root");
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </DisclosureListItem>
                          <DisclosureListItem
                            ariaLabel={`Choose chord type, ${labels.chordTypeLabel} selected`}
                            isOpen={chordDisclosure.openChoice === "type"}
                            keepMounted
                            label="Chord Type"
                            preview={labels.chordTypeLabel}
                            onToggle={() =>
                              chordDisclosure.toggleChoice("type")
                            }
                          >
                            <ChordCollectionPicker
                              value={chord.chordCollectionKey}
                              onChange={(chordCollectionKey) => {
                                updateChord(barIndex, chordIndex, {
                                  chordCollectionKey,
                                });
                                chordDisclosure.closeChoice("type");
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
                            label="Insert After"
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
                                          chords: candidateBar.chords.filter(
                                            (_, index) => index !== chordIndex,
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

      <div className={styles.editorActions}>
        <Button
          disabled={bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS}
          icon={<Plus />}
          label="Add Bar"
          size="sm"
          onClick={() =>
            setBars((current) => [...current, cloneBars([tonicBar])[0]!])
          }
        />
        <Button
          disabled={!canSave || submissionPending}
          icon={<Check />}
          label="Save Progression"
          size="sm"
          type="submit"
        />
      </div>
    </form>
  );
}
