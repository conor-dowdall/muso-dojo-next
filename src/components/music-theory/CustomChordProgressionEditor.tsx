"use client";

import {
  chordProgression,
  type ChordCollectionKey,
  type ChordProgression,
  type ChordProgressionDegree,
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
  CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR,
  CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR,
  CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR,
  createCustomProgressionBars,
  createCustomProgressionFromBars,
  customChordProgressionFlatDegrees,
  customChordProgressionSharpDegrees,
  getCustomProgressionCompatibleBeatCounts,
  normalizeCustomChordProgressionName,
  removeCustomProgressionDraftChord,
  selectCustomProgressionBarBeat,
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
  beatIndex: number;
  kind: "new";
  draft: {
    chordCollectionKey?: ChordCollectionKey;
    degree?: ChordProgressionDegree;
  };
}

type SelectedChord = ExistingSelectedChord | NewSelectedChord;

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
  beatCount: number,
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

  const selection = selectCustomProgressionBarBeat(
    bar,
    beatCount,
    selectedChord.beatIndex,
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
  degree: ChordProgressionDegree,
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

function getDegreeChromaticIndex(degree: ChordProgressionDegree) {
  const flatIndex = customChordProgressionFlatDegrees.indexOf(degree);
  return flatIndex >= 0
    ? flatIndex
    : customChordProgressionSharpDegrees.indexOf(degree);
}

function getInitialBeatCount(bars: readonly CustomChordProgressionDraftBar[]) {
  const compatibleBeatCounts = getCustomProgressionCompatibleBeatCounts(bars);

  return compatibleBeatCounts.includes(4) ? 4 : (compatibleBeatCounts[0] ?? 4);
}

function formatBeatCount(beats: number) {
  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
}

function getChordIndexAtBeat(
  chordStartBeatIndexes: readonly number[],
  beatIndex: number,
) {
  let chordIndex = 0;

  for (let index = 1; index < chordStartBeatIndexes.length; index += 1) {
    if (chordStartBeatIndexes[index]! > beatIndex) break;
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
  const [beatCount, setBeatCount] = useState(() =>
    getInitialBeatCount(initialBars),
  );
  const [isBeatCountOpen, setIsBeatCountOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState<SelectedChord | null>(
    null,
  );
  const [degreeSpelling, setDegreeSpelling] = useState<DegreeSpelling>("flat");
  const submissionPendingRef = useRef(false);
  const [submissionPending, setSubmissionPending] = useState(false);
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
    selectedChord === null &&
    (initialProgression === undefined || hasChanges);
  const compatibleBeatCounts = useMemo(
    () => getCustomProgressionCompatibleBeatCounts(bars),
    [bars],
  );
  const beatChoices = Array.from(
    {
      length:
        CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR -
        CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR +
        1,
    },
    (_, index) => CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR + index,
  );

  const addBar = () => {
    setBars((current) => [...current, cloneBars([tonicBar])[0]!]);
    setSelectedChord(null);
  };

  const changeDegreeSpelling = (spelling: DegreeSpelling) => {
    setDegreeSpelling(spelling);
    if (!selectedChord?.draft.degree) return;

    const degreeIndex = getDegreeChromaticIndex(selectedChord.draft.degree);
    const nextDegree = getDegreeOptions(spelling)[degreeIndex];

    if (nextDegree && nextDegree !== selectedChord.draft.degree) {
      setSelectedChord((current) =>
        current?.kind === "existing"
          ? {
              ...current,
              draft: { ...current.draft, degree: nextDegree },
            }
          : current?.kind === "new"
            ? {
                ...current,
                draft: { ...current.draft, degree: nextDegree },
              }
            : current,
      );
    }
  };

  const updateSelectedChordDraft = (
    patch: Partial<
      Pick<
        CustomChordProgressionDraftBar["chords"][number],
        "chordCollectionKey" | "degree"
      >
    >,
  ) => {
    setSelectedChord((current) =>
      current?.kind === "existing"
        ? { ...current, draft: { ...current.draft, ...patch } }
        : current?.kind === "new"
          ? { ...current, draft: { ...current.draft, ...patch } }
          : current,
    );
  };

  const commitNewSelectedChord = (
    patch: Partial<
      Pick<
        CustomChordProgressionDraftBar["chords"][number],
        "chordCollectionKey" | "degree"
      >
    >,
  ) => {
    if (selectedChord?.kind !== "new") return false;

    const bar = bars[selectedChord.barIndex];
    if (!bar) return false;

    const selection = selectCustomProgressionBarBeat(
      bar,
      beatCount,
      selectedChord.beatIndex,
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

  const selectChordDegree = (degree: ChordProgressionDegree) => {
    if (!commitNewSelectedChord({ degree })) {
      updateSelectedChordDraft({ degree });
    }
  };

  const selectChordQuality = (chordCollectionKey: ChordCollectionKey) => {
    if (!commitNewSelectedChord({ chordCollectionKey })) {
      updateSelectedChordDraft({ chordCollectionKey });
    }
  };

  const commitSelectedChord = () => {
    if (!selectedChordIsComplete(selectedChord)) return;

    setBars((current) =>
      applySelectedChordDraft(current, selectedChord, beatCount),
    );
    setSelectedChord(null);
  };

  const selectBeat = (barIndex: number, beatIndex: number) => {
    if (
      selectedChord?.kind === "new" &&
      selectedChord.barIndex === barIndex &&
      selectedChord.beatIndex === beatIndex
    ) {
      setBars(applySelectedChordDraft(bars, selectedChord, beatCount));
      setSelectedChord(null);
      return;
    }

    const committedBars = applySelectedChordDraft(
      bars,
      selectedChord,
      beatCount,
    );
    const bar = committedBars[barIndex];
    if (!bar) return;

    const selection = selectCustomProgressionBarBeat(bar, beatCount, beatIndex);
    if (!selection) return;

    setIsBeatCountOpen(false);

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
        beatIndex,
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
      const next = [...current];
      [next[barIndex], next[nextIndex]] = [next[nextIndex]!, next[barIndex]!];
      return next;
    });
    setSelectedChord(null);
  };

  const duplicateBar = (barIndex: number) => {
    if (bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS) return;

    setBars((current) => [
      ...current.slice(0, barIndex + 1),
      ...cloneBars([current[barIndex]!]),
      ...current.slice(barIndex + 1),
    ]);
    setSelectedChord(null);
  };

  const removeBar = (barIndex: number) => {
    setBars((current) => current.filter((_, index) => index !== barIndex));
    setSelectedChord(null);
    if (bars.length === 1) setIsBeatCountOpen(false);
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
              ariaLabel={`Beats per bar. Current: ${formatBeatCount(beatCount)}`}
              disabled={selectedChord !== null}
              isOpen={isBeatCountOpen}
              label="Beats per Bar"
              panelVariant="menu"
              preview={formatBeatCount(beatCount)}
              onToggle={() => setIsBeatCountOpen((current) => !current)}
            >
              <div
                aria-label="Beats per bar"
                className={`${choiceGridStyles.tokenGrid} ${choiceGridStyles.numericTokenGrid}`}
                role="group"
              >
                {beatChoices.map((beats) => {
                  const isAvailable = compatibleBeatCounts.includes(beats);

                  return (
                    <OptionButton
                      key={beats}
                      aria-label={
                        isAvailable
                          ? `Use ${formatBeatCount(beats).toLocaleLowerCase()}`
                          : `${formatBeatCount(beats)}. Not compatible with the current chord changes`
                      }
                      className={`${choiceGridStyles.tokenChoice} ${choiceGridStyles.squareTokenChoice}`}
                      disabled={!isAvailable}
                      label={beats}
                      presentation="tile"
                      selected={beatCount === beats}
                      onClick={() => {
                        setBeatCount(beats);
                        setIsBeatCountOpen(false);
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
              const chordStartBeatIndexes = bar.chords.map((chord) => {
                const startBeatIndex = Math.round(
                  elapsedDurationInBars * beatCount,
                );
                elapsedDurationInBars += chord.durationInBars;
                return startBeatIndex;
              });
              const barGridStyle = {
                "--custom-progression-beats": beatCount,
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
                            disabled={selectedChord !== null || barIndex === 0}
                            icon={<ListStart />}
                            size="sm"
                            onClick={() => moveBar(barIndex, "earlier")}
                          />
                          <IconButton
                            aria-label={`Move bar ${barIndex + 1} later`}
                            disabled={
                              selectedChord !== null ||
                              barIndex === bars.length - 1
                            }
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
                              selectedChord !== null ||
                              bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS
                            }
                            icon={<Copy />}
                            size="sm"
                            onClick={() => duplicateBar(barIndex)}
                          />
                          <IconButton
                            aria-label={`Remove bar ${barIndex + 1}`}
                            disabled={selectedChord !== null}
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
                    className={styles.chordBeatGrid}
                    role="group"
                    style={barGridStyle}
                  >
                    {beatChoices.slice(0, beatCount).map((_, beatIndex) => {
                      const chordStartIndex =
                        chordStartBeatIndexes.indexOf(beatIndex);
                      const isChordStart = chordStartIndex >= 0;
                      const chordIndex = getChordIndexAtBeat(
                        chordStartBeatIndexes,
                        beatIndex,
                      );
                      const chord = bar.chords[chordIndex]!;
                      const existingSelected =
                        selectedChord?.kind === "existing" &&
                        selectedChord.barIndex === barIndex &&
                        selectedChord.chordIndex === chordIndex;
                      const pendingSelected =
                        selectedChord?.kind === "new" &&
                        selectedChord.barIndex === barIndex &&
                        selectedChord.beatIndex === beatIndex;
                      const displayChord = existingSelected
                        ? selectedChord.draft
                        : chord;
                      const romanSymbol = getChordRomanSymbol(
                        displayChord.degree,
                        displayChord.chordCollectionKey,
                      );

                      return (
                        <OptionButton
                          key={beatIndex}
                          aria-label={
                            isChordStart
                              ? `Edit ${romanSymbol} on beat ${beatIndex + 1} in bar ${barIndex + 1}`
                              : `Choose a chord for beat ${beatIndex + 1} in bar ${barIndex + 1}`
                          }
                          className={styles.chordBeatButton}
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
                          onClick={() => selectBeat(barIndex, beatIndex)}
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
                            : `beat-${selectedChord.beatIndex}`;

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

                            <DisclosureListPanelActions align="stretch">
                              {selectedChord.kind === "existing" &&
                              bar.chords.length > 1 ? (
                                <Button
                                  label="Remove Chord"
                                  size="sm"
                                  tone="danger"
                                  onClick={removeSelectedChord}
                                />
                              ) : null}
                              <Button
                                disabled={
                                  !selectedChordIsComplete(selectedChord)
                                }
                                label="Done"
                                size="sm"
                                onClick={commitSelectedChord}
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
              disabled={
                selectedChord !== null ||
                bars.length >= CUSTOM_CHORD_PROGRESSION_MAX_BARS
              }
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
