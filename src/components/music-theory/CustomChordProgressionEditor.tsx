"use client";

import {
  chordProgression,
  type ChordCollectionKey,
  type ChordProgression,
  type ChordRootDegree,
} from "@musodojo/music-theory-data";
import { Copy, ListEnd, ListStart, Plus, Trash2 } from "lucide-react";
import {
  type CSSProperties,
  type SyntheticEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import { ChoiceModeControl } from "@/components/ui/choice-mode-control/ChoiceModeControl";
import {
  DisclosureList,
  DisclosureListItem,
  DisclosureListPanelActions,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NamedLibraryItemSaveField } from "@/components/ui/named-library-item/NamedLibraryItemSaveField";
import { ChordQualityPicker } from "./ChordQualityPicker";
import {
  CUSTOM_CHORD_PROGRESSION_MAX_BARS,
  CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR,
  CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS,
  CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS,
  createCustomProgressionBars,
  createCustomProgressionFromBars,
  customChordProgressionFlatDegrees,
  customChordProgressionSharpDegrees,
  getCustomProgressionCompatiblePositionCounts,
  normalizeCustomChordProgressionName,
  removeCustomProgressionDraftChord,
  selectCustomProgressionBarPosition,
  type CustomChordProgressionDraftBar,
} from "@/utils/music-theory/customChordProgressions";
import styles from "./CustomChordProgressionEditor.module.css";

interface CustomChordProgressionEditorProps {
  initialName?: string;
  initialProgression?: ChordProgression;
  isNameAvailable?: (name: string) => boolean;
  onSave: (name: string, progression: ChordProgression) => boolean;
}

interface ExistingSelectedChord {
  barIndex: number;
  chordIndex: number;
  kind: "existing";
  draft: CustomChordProgressionDraftBar["chords"][number];
}

interface NewSelectedChord {
  barIndex: number;
  positionIndex: number;
  kind: "new";
  draft: {
    chordCollectionKey?: ChordCollectionKey;
    degree?: ChordRootDegree;
  };
}

type SelectedChord = ExistingSelectedChord | NewSelectedChord;
type SelectedChordDraftPatch = Partial<
  Pick<
    CustomChordProgressionDraftBar["chords"][number],
    "chordCollectionKey" | "degree"
  >
>;

type DegreeSpelling = "flat" | "sharp";

const degreeSpellingOptions = [
  {
    ariaLabel: "Use flat degree spellings",
    label: "Flat",
    value: "flat",
  },
  {
    ariaLabel: "Use sharp degree spellings",
    label: "Sharp",
    value: "sharp",
  },
] as const;

const tonicBar = {
  chords: [{ chordCollectionKey: "major", degree: "1", durationInBars: 1 }],
} satisfies CustomChordProgressionDraftBar;

function cloneBars(bars: readonly CustomChordProgressionDraftBar[]) {
  return bars.map((bar) => ({
    chords: bar.chords.map((chord) => ({ ...chord })),
  }));
}

function getInitialBars(progression: ChordProgression | undefined) {
  return progression
    ? cloneBars(createCustomProgressionBars(progression) ?? [])
    : cloneBars([tonicBar]);
}

function applySelectedChordDraft(
  bars: readonly CustomChordProgressionDraftBar[],
  selectedChord: SelectedChord | null,
  positionCount: number,
) {
  const clonedBars = bars.map((bar, barIndex) => ({
    chords: bar.chords.map((chord, chordIndex) =>
      selectedChord?.kind === "existing" &&
      selectedChord.barIndex === barIndex &&
      selectedChord.chordIndex === chordIndex
        ? { ...selectedChord.draft }
        : { ...chord },
    ),
  }));

  if (
    selectedChord?.kind !== "new" ||
    !selectedChord.draft.degree ||
    !selectedChord.draft.chordCollectionKey
  ) {
    return clonedBars;
  }

  const bar = clonedBars[selectedChord.barIndex];
  if (!bar) return clonedBars;

  const selection = selectCustomProgressionBarPosition(
    bar,
    positionCount,
    selectedChord.positionIndex,
  );
  if (!selection?.inserted) return clonedBars;

  const insertedChord = selection.bar.chords[selection.chordIndex];
  if (!insertedChord) return clonedBars;

  selection.bar.chords[selection.chordIndex] = {
    ...insertedChord,
    chordCollectionKey: selectedChord.draft.chordCollectionKey,
    degree: selectedChord.draft.degree,
  };
  clonedBars[selectedChord.barIndex] = selection.bar;

  return clonedBars;
}

function selectedChordIsComplete(selectedChord: SelectedChord | null) {
  return (
    selectedChord?.kind === "existing" ||
    (selectedChord?.kind === "new" &&
      selectedChord.draft.degree !== undefined &&
      selectedChord.draft.chordCollectionKey !== undefined)
  );
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
            chord.chordCollectionKey === candidate.chordCollectionKey &&
            chord.durationInBars === candidate.durationInBars
          );
        }),
    )
  );
}

function getChordRomanSymbol(
  degree: ChordRootDegree,
  chordCollectionKey: ChordCollectionKey,
) {
  return (
    chordProgression.getDirectRomanSymbols({
      chords: [{ chordCollectionKey, degree, durationInBars: 1 }],
    })[0] ?? degree
  );
}

function formatBarNumber(barIndex: number) {
  return String(barIndex + 1).padStart(2, "0");
}

function getDegreeOptions(spelling: DegreeSpelling) {
  return spelling === "flat"
    ? customChordProgressionFlatDegrees
    : customChordProgressionSharpDegrees;
}

function getDegreeChromaticIndex(degree: ChordRootDegree) {
  const flatIndex = customChordProgressionFlatDegrees.indexOf(degree);
  return flatIndex >= 0
    ? flatIndex
    : customChordProgressionSharpDegrees.indexOf(degree);
}

function getInitialPositionCount(
  bars: readonly CustomChordProgressionDraftBar[],
) {
  const compatiblePositionCounts =
    getCustomProgressionCompatiblePositionCounts(bars);

  return compatiblePositionCounts.includes(4)
    ? 4
    : (compatiblePositionCounts[0] ?? 4);
}

function formatPositionCount(positionCount: number) {
  return `${positionCount} per Bar`;
}

function getChordIndexAtPosition(
  chordStartPositionIndexes: readonly number[],
  positionIndex: number,
) {
  let chordIndex = 0;

  for (let index = 1; index < chordStartPositionIndexes.length; index += 1) {
    if (chordStartPositionIndexes[index]! > positionIndex) break;
    chordIndex = index;
  }

  return chordIndex;
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
  const [positionCount, setPositionCount] = useState(() =>
    getInitialPositionCount(initialBars),
  );
  const [isPositionCountOpen, setIsPositionCountOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState<SelectedChord | null>(
    null,
  );
  const [degreeSpelling, setDegreeSpelling] = useState<DegreeSpelling>("flat");
  const submissionPendingRef = useRef(false);
  const [submissionPending, setSubmissionPending] = useState(false);
  const savableBars = useMemo(
    () =>
      selectedChordIsComplete(selectedChord)
        ? applySelectedChordDraft(bars, selectedChord, positionCount)
        : bars,
    [bars, positionCount, selectedChord],
  );
  const progression = useMemo(
    () => createCustomProgressionFromBars(savableBars),
    [savableBars],
  );
  const normalizedName = normalizeCustomChordProgressionName(name);
  const normalizedInitialName =
    normalizeCustomChordProgressionName(initialName);
  const hasNameConflict =
    normalizedName !== undefined && !isNameAvailable(normalizedName);
  const hasChanges =
    normalizedName !== normalizedInitialName ||
    !barsAreEqual(savableBars, initialBars);
  const canSave =
    normalizedName !== undefined &&
    !hasNameConflict &&
    progression !== undefined &&
    (initialProgression === undefined || hasChanges);
  const compatiblePositionCounts = useMemo(
    () => getCustomProgressionCompatiblePositionCounts(bars),
    [bars],
  );
  const positionChoices = Array.from(
    {
      length:
        CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS -
        CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS +
        1,
    },
    (_, index) => CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS + index,
  );

  const addBar = () => {
    setBars((current) => [
      ...applySelectedChordDraft(current, selectedChord, positionCount),
      cloneBars([tonicBar])[0]!,
    ]);
    setSelectedChord(null);
  };

  const updateSelectedChordDraft = (patch: SelectedChordDraftPatch) => {
    if (!selectedChord) return;

    if (selectedChord.kind === "existing") {
      setSelectedChord({
        ...selectedChord,
        draft: { ...selectedChord.draft, ...patch },
      });
      setBars((current) =>
        current.map((bar, barIndex) =>
          barIndex === selectedChord.barIndex
            ? {
                chords: bar.chords.map((chord, chordIndex) =>
                  chordIndex === selectedChord.chordIndex
                    ? { ...chord, ...patch }
                    : chord,
                ),
              }
            : bar,
        ),
      );
      return;
    }

    setSelectedChord({
      ...selectedChord,
      draft: { ...selectedChord.draft, ...patch },
    });
  };

  const changeDegreeSpelling = (spelling: DegreeSpelling) => {
    setDegreeSpelling(spelling);
    if (!selectedChord?.draft.degree) return;

    const degreeIndex = getDegreeChromaticIndex(selectedChord.draft.degree);
    const nextDegree = getDegreeOptions(spelling)[degreeIndex];

    if (nextDegree && nextDegree !== selectedChord.draft.degree) {
      updateSelectedChordDraft({ degree: nextDegree });
    }
  };

  const commitNewSelectedChord = (patch: SelectedChordDraftPatch) => {
    if (selectedChord?.kind !== "new") return false;

    const bar = bars[selectedChord.barIndex];
    if (!bar) return false;

    const selection = selectCustomProgressionBarPosition(
      bar,
      positionCount,
      selectedChord.positionIndex,
    );
    if (!selection?.inserted) return false;

    const insertedChord = selection.bar.chords[selection.chordIndex];
    if (!insertedChord) return false;

    const chord = {
      ...insertedChord,
      chordCollectionKey:
        patch.chordCollectionKey ??
        selectedChord.draft.chordCollectionKey ??
        "major",
      degree: patch.degree ?? selectedChord.draft.degree ?? "1",
    };
    selection.bar.chords[selection.chordIndex] = chord;

    setBars((current) =>
      current.map((candidateBar, barIndex) =>
        barIndex === selectedChord.barIndex ? selection.bar : candidateBar,
      ),
    );
    setSelectedChord({
      barIndex: selectedChord.barIndex,
      chordIndex: selection.chordIndex,
      draft: { ...chord },
      kind: "existing",
    });

    return true;
  };

  const selectChordDegree = (degree: ChordRootDegree) => {
    if (!commitNewSelectedChord({ degree })) {
      updateSelectedChordDraft({ degree });
    }
  };

  const selectChordQuality = (chordCollectionKey: ChordCollectionKey) => {
    if (!commitNewSelectedChord({ chordCollectionKey })) {
      updateSelectedChordDraft({ chordCollectionKey });
    }
  };

  const closeSelectedChordEditor = () => {
    if (selectedChordIsComplete(selectedChord)) {
      setBars((current) =>
        applySelectedChordDraft(current, selectedChord, positionCount),
      );
    }
    setSelectedChord(null);
  };

  const selectPosition = (barIndex: number, positionIndex: number) => {
    if (
      selectedChord?.kind === "new" &&
      selectedChord.barIndex === barIndex &&
      selectedChord.positionIndex === positionIndex
    ) {
      setBars(applySelectedChordDraft(bars, selectedChord, positionCount));
      setSelectedChord(null);
      return;
    }

    const committedBars = applySelectedChordDraft(
      bars,
      selectedChord,
      positionCount,
    );
    const bar = committedBars[barIndex];
    if (!bar) return;

    const selection = selectCustomProgressionBarPosition(
      bar,
      positionCount,
      positionIndex,
    );
    if (!selection) return;

    setIsPositionCountOpen(false);

    if (
      !selection.inserted &&
      selectedChord?.kind === "existing" &&
      selectedChord.barIndex === barIndex &&
      selectedChord.chordIndex === selection.chordIndex
    ) {
      setBars(committedBars);
      setSelectedChord(null);
      return;
    }

    if (selection.inserted) {
      setBars(committedBars);
      setSelectedChord({
        barIndex,
        positionIndex,
        draft: {},
        kind: "new",
      });
      return;
    }

    const chord = selection.bar.chords[selection.chordIndex]!;

    if (chord.degree.startsWith("♯")) {
      setDegreeSpelling("sharp");
    } else if (chord.degree.startsWith("♭")) {
      setDegreeSpelling("flat");
    }

    setBars(
      committedBars.map((candidateBar, candidateBarIndex) =>
        candidateBarIndex === barIndex ? selection.bar : candidateBar,
      ),
    );

    setSelectedChord({
      barIndex,
      chordIndex: selection.chordIndex,
      draft: { ...chord },
      kind: "existing",
    });
  };

  const removeSelectedChord = () => {
    if (selectedChord?.kind !== "existing") return;

    const { barIndex, chordIndex } = selectedChord;
    setBars((current) =>
      current.map((bar, candidateBarIndex) =>
        candidateBarIndex === barIndex
          ? (removeCustomProgressionDraftChord(bar, chordIndex) ?? bar)
          : bar,
      ),
    );
    setSelectedChord(null);
  };

  const moveBar = (barIndex: number, direction: "earlier" | "later") => {
    const nextIndex = direction === "earlier" ? barIndex - 1 : barIndex + 1;
    if (nextIndex < 0 || nextIndex >= bars.length) return;

    setBars((current) => {
      const next = [
        ...applySelectedChordDraft(current, selectedChord, positionCount),
      ];
      [next[barIndex], next[nextIndex]] = [next[nextIndex]!, next[barIndex]!];
      return next;
    });
    setSelectedChord(null);
  };

  const duplicateBar = (barIndex: number) => {
    if (bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS) return;

    setBars((current) => {
      const next = applySelectedChordDraft(
        current,
        selectedChord,
        positionCount,
      );

      return [
        ...next.slice(0, barIndex + 1),
        ...cloneBars([next[barIndex]!]),
        ...next.slice(barIndex + 1),
      ];
    });
    setSelectedChord(null);
  };

  const removeBar = (barIndex: number) => {
    setBars((current) =>
      applySelectedChordDraft(current, selectedChord, positionCount).filter(
        (_, index) => index !== barIndex,
      ),
    );
    setSelectedChord(null);
    if (bars.length === 1) setIsPositionCountOpen(false);
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
      const wasSaved = onSave(normalizedName, progression);

      if (!wasSaved) {
        submissionPendingRef.current = false;
        setSubmissionPending(false);
      }
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
          <Button
            icon={<Plus />}
            label="Add First Bar"
            size="sm"
            onClick={addBar}
          />
        </div>
      ) : (
        <>
          <DisclosureList>
            <DisclosureListItem
              ariaLabel={`Chord positions per bar. Current: ${positionCount}`}
              isOpen={isPositionCountOpen}
              label="Chord Positions"
              panelVariant="menu"
              preview={formatPositionCount(positionCount)}
              onToggle={() => {
                closeSelectedChordEditor();
                setIsPositionCountOpen((current) => !current);
              }}
            >
              <div
                aria-label="Chord positions per bar"
                className={`${choiceGridStyles.tokenGrid} ${choiceGridStyles.numericTokenGrid}`}
                role="group"
              >
                {positionChoices.map((candidatePositionCount) => {
                  const isAvailable = compatiblePositionCounts.includes(
                    candidatePositionCount,
                  );

                  return (
                    <OptionButton
                      key={candidatePositionCount}
                      aria-label={
                        isAvailable
                          ? `Use ${candidatePositionCount} chord positions per bar`
                          : `${candidatePositionCount} chord positions per bar. Not compatible with the current chord changes`
                      }
                      className={`${choiceGridStyles.tokenChoice} ${choiceGridStyles.squareTokenChoice}`}
                      disabled={!isAvailable}
                      label={candidatePositionCount}
                      presentation="tile"
                      selected={positionCount === candidatePositionCount}
                      onClick={() => {
                        setPositionCount(candidatePositionCount);
                        setIsPositionCountOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            </DisclosureListItem>
          </DisclosureList>

          <div className={styles.barList}>
            {bars.map((bar, barIndex) => {
              let elapsedDurationInBars = 0;
              const chordStartPositionIndexes = bar.chords.map((chord) => {
                const startPositionIndex = Math.round(
                  elapsedDurationInBars * positionCount,
                );
                elapsedDurationInBars += chord.durationInBars;
                return startPositionIndex;
              });
              const barGridStyle = {
                "--custom-progression-grid-columns": positionCount,
              } as CSSProperties;

              return (
                <section
                  key={`bar-${barIndex}`}
                  aria-label={`Bar ${barIndex + 1}`}
                  className={styles.bar}
                >
                  <ControlHeader
                    className={styles.barHeader}
                    primary={
                      <span aria-hidden="true" className={styles.barNumber}>
                        {formatBarNumber(barIndex)}
                      </span>
                    }
                    actions={
                      <ControlHeaderCluster gap="cluster">
                        <ControlHeaderCluster
                          aria-label={`Reorder bar ${barIndex + 1}`}
                          role="group"
                        >
                          <IconButton
                            aria-label={`Move bar ${barIndex + 1} earlier`}
                            disabled={barIndex === 0}
                            icon={<ListStart />}
                            size="sm"
                            onClick={() => moveBar(barIndex, "earlier")}
                          />
                          <IconButton
                            aria-label={`Move bar ${barIndex + 1} later`}
                            disabled={barIndex === bars.length - 1}
                            icon={<ListEnd />}
                            size="sm"
                            onClick={() => moveBar(barIndex, "later")}
                          />
                        </ControlHeaderCluster>
                        <ControlHeaderCluster
                          aria-label={`Manage bar ${barIndex + 1}`}
                          role="group"
                        >
                          <IconButton
                            aria-label={`Duplicate bar ${barIndex + 1}`}
                            disabled={
                              bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS
                            }
                            icon={<Copy />}
                            size="sm"
                            onClick={() => duplicateBar(barIndex)}
                          />
                          <IconButton
                            aria-label={`Remove bar ${barIndex + 1}`}
                            icon={<Trash2 />}
                            size="sm"
                            tone="danger"
                            onClick={() => removeBar(barIndex)}
                          />
                        </ControlHeaderCluster>
                      </ControlHeaderCluster>
                    }
                  />

                  <div
                    aria-label={`Chords in bar ${barIndex + 1}`}
                    className={styles.chordPositionGrid}
                    role="group"
                    style={barGridStyle}
                  >
                    {positionChoices
                      .slice(0, positionCount)
                      .map((_, positionIndex) => {
                        const chordStartIndex =
                          chordStartPositionIndexes.indexOf(positionIndex);
                        const isChordStart = chordStartIndex >= 0;
                        const chordIndex = getChordIndexAtPosition(
                          chordStartPositionIndexes,
                          positionIndex,
                        );
                        const chord = bar.chords[chordIndex]!;
                        const existingSelected =
                          selectedChord?.kind === "existing" &&
                          selectedChord.barIndex === barIndex &&
                          selectedChord.chordIndex === chordIndex;
                        const pendingSelected =
                          selectedChord?.kind === "new" &&
                          selectedChord.barIndex === barIndex &&
                          selectedChord.positionIndex === positionIndex;
                        const displayChord = existingSelected
                          ? selectedChord.draft
                          : chord;
                        const romanSymbol = getChordRomanSymbol(
                          displayChord.degree,
                          displayChord.chordCollectionKey,
                        );

                        return (
                          <OptionButton
                            key={positionIndex}
                            aria-label={
                              isChordStart
                                ? `Edit ${romanSymbol} at position ${positionIndex + 1} in bar ${barIndex + 1}`
                                : `Choose a chord for position ${positionIndex + 1} in bar ${barIndex + 1}`
                            }
                            className={styles.chordPositionButton}
                            data-chord-start={isChordStart ? true : undefined}
                            data-repeat={isChordStart ? undefined : true}
                            density="compact"
                            disabled={
                              !isChordStart &&
                              bar.chords.length >=
                                CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR
                            }
                            label={isChordStart ? romanSymbol : "/"}
                            labelProps={{
                              titleSize: "lg",
                              titleWeight: "semibold",
                            }}
                            presentation="tile"
                            selected={
                              pendingSelected ||
                              (isChordStart ? existingSelected : false)
                            }
                            onClick={() =>
                              selectPosition(barIndex, positionIndex)
                            }
                          />
                        );
                      })}
                  </div>

                  {selectedChord?.barIndex === barIndex
                    ? (() => {
                        if (
                          selectedChord.kind === "existing" &&
                          !bar.chords[selectedChord.chordIndex]
                        ) {
                          return null;
                        }
                        const draft = selectedChord.draft;
                        const selectedChordKey =
                          selectedChord.kind === "existing"
                            ? `chord-${selectedChord.chordIndex}`
                            : `position-${selectedChord.positionIndex}`;

                        return (
                          <div className={styles.chordEditor}>
                            <div className={styles.choiceSection}>
                              <ChoiceModeControl
                                ariaLabel="Degree spelling"
                                options={degreeSpellingOptions}
                                value={degreeSpelling}
                                onChange={changeDegreeSpelling}
                              />
                              <div
                                aria-label="Chord degree"
                                className={styles.degreeGrid}
                                role="group"
                              >
                                {getDegreeOptions(degreeSpelling).map(
                                  (degree) => (
                                    <OptionButton
                                      key={degree}
                                      aria-label={`Use ${degree} degree`}
                                      className={styles.degreeChoice}
                                      density="compact"
                                      label={degree}
                                      presentation="tile"
                                      selected={draft.degree === degree}
                                      onClick={() => selectChordDegree(degree)}
                                    />
                                  ),
                                )}
                              </div>
                            </div>

                            <div className={styles.choiceSection}>
                              <ChordQualityPicker
                                key={`${barIndex}-${selectedChordKey}`}
                                value={draft.chordCollectionKey}
                                onChange={selectChordQuality}
                              />
                            </div>

                            <DisclosureListPanelActions>
                              <Button
                                disabled={
                                  selectedChord.kind !== "existing" ||
                                  bar.chords.length <= 1
                                }
                                label="Remove Chord"
                                size="sm"
                                tone="danger"
                                onClick={removeSelectedChord}
                              />
                              <Button
                                label="Close"
                                size="sm"
                                onClick={closeSelectedChordEditor}
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
        saveLabel="Save"
        value={name}
        onChange={setName}
      />
    </form>
  );
}
