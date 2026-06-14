import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CirclePile,
  CircleSmall,
  Merge,
  Minus,
  Music,
  Music3,
  Music4,
  Plus,
  Spline,
  Split,
} from "lucide-react";
import { TactileIconButton } from "@/components/ui/buttons/TactileButton";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { type ExerciseSubdivision } from "@/types/session";
import { getExerciseDegreeOptions } from "@/utils/exercise-looper/exerciseConfig";
import {
  getExerciseRhythmSelection,
  getExerciseSubdivisionForRhythm,
  getExerciseSubdivisionLabel,
  type ExerciseNoteValue,
} from "@/utils/exercise-looper/exerciseRhythm";
import {
  getExerciseIntervalLabel,
  type ExerciseNotePlayback,
  type ExercisePattern,
  type ExercisePatternMode,
  type ExerciseScaleDirection,
} from "@/utils/exercise-looper/exerciseSequence";
import { type ExerciseStudyDisplay } from "@/utils/exercise-looper/exerciseStudyDisplay";
import styles from "./ExerciseLooperModule.module.css";

const MODE_FEEDBACK_DURATION_MS = 2000;

function getCompactDirectionLabel(direction: ExerciseScaleDirection) {
  switch (direction) {
    case "ascending":
      return "Up";
    case "descending":
      return "Down";
    case "up-down":
      return "Up-Down";
  }
}

function getStudyDisplayAriaLabel(display: ExerciseStudyDisplay) {
  if (display.kind === "chord") {
    return `${display.chordName}. Notes ${display.notes.join(", ")}. Intervals ${display.intervals.join(", ")}`;
  }

  return `Notes ${display.notes.join(", ")}. Intervals ${display.intervals.join(", ")}`;
}

function ExerciseStudyNotePairs({
  intervals,
  notes,
}: {
  intervals: readonly string[];
  notes: readonly string[];
}) {
  return (
    <span className={styles.studyNotePairs}>
      {notes.map((note, index) => (
        <span key={`${note}-${index}`} className={styles.studyNotePair}>
          <span className={styles.studyNoteName}>{note}</span>
          <span className={styles.studyInterval}>{intervals[index]}</span>
        </span>
      ))}
    </span>
  );
}

function ExerciseStudyReadout({ display }: { display: ExerciseStudyDisplay }) {
  return (
    <output
      aria-label={getStudyDisplayAriaLabel(display)}
      aria-live="off"
      className={styles.studyReadout}
    >
      <span
        className={styles.studyDisplayContent}
        data-extended-chord={
          display.kind === "chord" && display.intervals.length > 5
            ? true
            : undefined
        }
        data-dense={display.notes.length > 8 ? true : undefined}
        data-kind={display.kind}
      >
        {display.kind === "chord" ? (
          <span className={styles.studyChordName}>{display.chordName}</span>
        ) : null}
        <ExerciseStudyNotePairs
          intervals={display.intervals}
          notes={display.notes}
        />
      </span>
    </output>
  );
}

const directionChoices = [
  { direction: "up-down", icon: <ArrowUpDown />, label: "Up and down" },
  { direction: "ascending", icon: <ArrowUp />, label: "Ascending" },
  { direction: "descending", icon: <ArrowDown />, label: "Descending" },
] as const satisfies readonly {
  direction: ExerciseScaleDirection;
  icon: ReactNode;
  label: string;
}[];

const patternModeChoices = [
  {
    icon: <CircleSmall />,
    label: "Single notes",
    mode: "single",
    readout: "Single Notes",
  },
  {
    icon: <Spline />,
    label: "Play an interval from each note",
    mode: "interval",
    readout: "Intervals",
  },
  {
    icon: <CirclePile />,
    label: "Play a chord from each note",
    mode: "extension",
    readout: "Chords",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  mode: ExercisePatternMode;
  readout: string;
}[];

const notePlaybackChoices = [
  {
    icon: <Split />,
    label: "Play notes separately",
    playback: "separate",
  },
  {
    icon: <Merge />,
    label: "Play notes together",
    playback: "together",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  playback: ExerciseNotePlayback;
}[];

const noteValueChoices = [
  {
    icon: <Music3 />,
    label: "Quarter notes",
    noteValue: "quarter",
  },
  {
    icon: <Music />,
    label: "Eighth notes",
    noteValue: "eighth",
  },
  {
    icon: <Music4 />,
    label: "Sixteenth notes",
    noteValue: "sixteenth",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  noteValue: ExerciseNoteValue;
}[];

export function ExercisePatternControls({
  onChange,
  onSubdivisionChange,
  pattern,
  studyDisplay,
  subdivision,
  supportsScaleDegreeExercises,
  supportsTertianExercises,
}: {
  onChange?: (pattern: ExercisePattern) => void;
  onSubdivisionChange?: (subdivision: ExerciseSubdivision) => void;
  pattern: ExercisePattern;
  studyDisplay: ExerciseStudyDisplay;
  subdivision: ExerciseSubdivision;
  supportsScaleDegreeExercises: boolean;
  supportsTertianExercises: boolean;
}) {
  const [modeFeedbackVersion, setModeFeedbackVersion] = useState(0);
  const intervalDegreeOptions = getExerciseDegreeOptions("interval");
  const extensionDegreeOptions = getExerciseDegreeOptions("extension");
  const intervalDegreeIndex = intervalDegreeOptions.indexOf(
    pattern.intervalDegree,
  );
  const extensionDegreeIndex = extensionDegreeOptions.indexOf(
    pattern.extensionDegree,
  );
  const canDecreaseIntervalDegree = intervalDegreeIndex > 0;
  const canIncreaseIntervalDegree =
    intervalDegreeIndex >= 0 &&
    intervalDegreeIndex < intervalDegreeOptions.length - 1;
  const canDecreaseExtensionDegree = extensionDegreeIndex > 0;
  const canIncreaseExtensionDegree =
    extensionDegreeIndex >= 0 &&
    extensionDegreeIndex < extensionDegreeOptions.length - 1;
  const activeNoteDirection =
    pattern.mode === "interval"
      ? pattern.intervalDirection
      : pattern.extensionDirection;
  const activeDegreeLabel =
    pattern.mode === "interval"
      ? getExerciseIntervalLabel(pattern.intervalDegree)
      : getExerciseIntervalLabel(pattern.extensionDegree);
  const notePlaybackLabel =
    pattern.notePlayback === "separate" ? "Separate" : "Together";
  const innerDirectionLabel = getCompactDirectionLabel(activeNoteDirection);
  const selectedPatternModeLabel =
    patternModeChoices.find((choice) => choice.mode === pattern.mode)
      ?.readout ?? "Single Notes";
  const modeReadout =
    modeFeedbackVersion > 0 ? "Scale Modes Only" : selectedPatternModeLabel;
  const canDecreaseActiveDegree =
    pattern.mode === "interval"
      ? canDecreaseIntervalDegree
      : canDecreaseExtensionDegree;
  const canIncreaseActiveDegree =
    pattern.mode === "interval"
      ? canIncreaseIntervalDegree
      : canIncreaseExtensionDegree;
  const fineTuneUnavailable =
    pattern.mode === "single" ||
    !supportsScaleDegreeExercises ||
    (pattern.mode === "extension" && !supportsTertianExercises);
  const noteDirectionUnavailable =
    pattern.notePlayback === "together" || fineTuneUnavailable;
  const rhythm = getExerciseRhythmSelection(subdivision);
  const rhythmLabel = getExerciseSubdivisionLabel(subdivision);
  const tripletUnavailable = rhythm.noteValue === "quarter";

  useEffect(() => {
    if (modeFeedbackVersion === 0) {
      return;
    }

    const timeout = window.setTimeout(
      () => setModeFeedbackVersion(0),
      MODE_FEEDBACK_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [modeFeedbackVersion]);

  const clearModeFeedback = () => {
    setModeFeedbackVersion(0);
  };

  const showUnavailableModeFeedback = () => {
    setModeFeedbackVersion((version) => version + 1);
  };

  const isPatternModeUnavailable = (mode: ExercisePatternMode) =>
    (mode === "interval" && !supportsScaleDegreeExercises) ||
    (mode === "extension" && !supportsTertianExercises);

  const updatePattern = (patch: Partial<ExercisePattern>) => {
    clearModeFeedback();
    onChange?.({ ...pattern, ...patch });
  };

  const setPatternMode = (mode: ExercisePatternMode) => {
    if (isPatternModeUnavailable(mode)) {
      showUnavailableModeFeedback();
      return;
    }

    updatePattern({ mode });
  };

  const stepActiveDegree = (offset: -1 | 1) => {
    if (pattern.mode === "interval" && supportsScaleDegreeExercises) {
      const nextDegree = intervalDegreeOptions[intervalDegreeIndex + offset];
      if (nextDegree !== undefined) {
        updatePattern({ intervalDegree: nextDegree });
      }
      return;
    }

    if (pattern.mode === "extension" && supportsTertianExercises) {
      const nextDegree = extensionDegreeOptions[extensionDegreeIndex + offset];
      if (nextDegree !== undefined) {
        updatePattern({ extensionDegree: nextDegree });
      }
    }
  };

  const setActiveNoteDirection = (direction: ExerciseScaleDirection) => {
    if (pattern.mode === "interval" && supportsScaleDegreeExercises) {
      updatePattern({ intervalDirection: direction });
    } else if (pattern.mode === "extension" && supportsTertianExercises) {
      updatePattern({ extensionDirection: direction });
    }
  };

  const setNoteValue = (noteValue: ExerciseNoteValue) => {
    onSubdivisionChange?.(
      getExerciseSubdivisionForRhythm({
        feel: rhythm.feel,
        noteValue,
      }),
    );
  };

  const toggleTriplets = () => {
    if (tripletUnavailable) {
      return;
    }

    onSubdivisionChange?.(
      getExerciseSubdivisionForRhythm({
        feel: rhythm.feel === "triplet" ? "straight" : "triplet",
        noteValue: rhythm.noteValue,
      }),
    );
  };

  return (
    <div
      className={styles.patternControls}
      role="group"
      aria-label="Exercise pattern"
    >
      <div className={styles.patternSetupControls}>
        <TactileControlGroup
          aria-label="Direction"
          className={styles.setupControlGroup}
          controlsClassName={styles.directionControls}
          readout={getCompactDirectionLabel(pattern.direction)}
        >
          {directionChoices.map((choice) => (
            <TactileIconButton
              key={choice.direction}
              onPress={() => updatePattern({ direction: choice.direction })}
              aria-label={choice.label}
              className={styles.patternButton}
              icon={choice.icon}
              selected={pattern.direction === choice.direction}
              size="md"
            />
          ))}
        </TactileControlGroup>

        <TactileControlGroup
          aria-label="Rhythm"
          className={styles.setupControlGroup}
          controlsClassName={styles.rhythmControls}
          readout={rhythmLabel}
        >
          <span
            aria-label="Note value"
            className={styles.noteValueControls}
            role="group"
          >
            {noteValueChoices.map((choice) => (
              <TactileIconButton
                key={choice.noteValue}
                aria-label={choice.label}
                className={styles.patternButton}
                icon={choice.icon}
                onPress={() => setNoteValue(choice.noteValue)}
                selected={rhythm.noteValue === choice.noteValue}
                size="md"
              />
            ))}
          </span>
          <TactileIconButton
            aria-label={
              rhythm.feel === "triplet"
                ? "Use straight notes"
                : "Use triplet notes"
            }
            className={`${styles.patternButton} ${styles.tripletButton}`}
            icon={
              <span aria-hidden="true" className={styles.tripletButtonLabel}>
                3
              </span>
            }
            onPress={toggleTriplets}
            selected={rhythm.feel === "triplet"}
            size="md"
            unavailable={tripletUnavailable}
          />
        </TactileControlGroup>
      </div>

      <div
        aria-label="Exercise mode"
        className={styles.modeConfiguration}
        role="group"
      >
        <TactileControlGroup
          aria-label="Play mode"
          className={styles.modeControlGroup}
          controlsClassName={styles.modeControls}
          readout={modeReadout}
        >
          {patternModeChoices.map((choice) => (
            <TactileIconButton
              key={choice.mode}
              onPress={() => setPatternMode(choice.mode)}
              aria-label={choice.label}
              className={styles.modeButton}
              icon={choice.icon}
              onFocus={() => {
                if (isPatternModeUnavailable(choice.mode)) {
                  showUnavailableModeFeedback();
                } else {
                  clearModeFeedback();
                }
              }}
              onUnavailablePress={showUnavailableModeFeedback}
              selected={pattern.mode === choice.mode}
              size="md"
              unavailable={isPatternModeUnavailable(choice.mode)}
            />
          ))}
        </TactileControlGroup>

        <ExerciseStudyReadout display={studyDisplay} />

        <div
          aria-label={
            pattern.mode === "single"
              ? "Interval and chord controls"
              : `${selectedPatternModeLabel} controls`
          }
          className={styles.modeDetailControls}
          role="group"
        >
          <div className={styles.degreeAndPlaybackControls}>
            <TactileControlGroup
              aria-label={
                pattern.mode === "extension" ? "Chord size" : "Interval size"
              }
              controlsClassName={styles.degreeControls}
              readout={activeDegreeLabel}
              unavailable={fineTuneUnavailable}
            >
              <TactileIconButton
                onPress={() => stepActiveDegree(-1)}
                aria-label={
                  pattern.mode === "extension"
                    ? "Decrease chord size"
                    : "Decrease interval size"
                }
                className={`${styles.patternButton} ${styles.degreeButton}`}
                icon={<Minus />}
                size="md"
                unavailable={fineTuneUnavailable || !canDecreaseActiveDegree}
              />
              <TactileIconButton
                onPress={() => stepActiveDegree(1)}
                aria-label={
                  pattern.mode === "extension"
                    ? "Increase chord size"
                    : "Increase interval size"
                }
                className={`${styles.patternButton} ${styles.degreeButton}`}
                icon={<Plus />}
                size="md"
                unavailable={fineTuneUnavailable || !canIncreaseActiveDegree}
              />
            </TactileControlGroup>

            <TactileControlGroup
              aria-label="Note playback"
              controlsClassName={styles.contextualControls}
              readout={notePlaybackLabel}
              unavailable={fineTuneUnavailable}
            >
              {notePlaybackChoices.map((choice) => (
                <TactileIconButton
                  key={choice.playback}
                  onPress={() =>
                    updatePattern({ notePlayback: choice.playback })
                  }
                  aria-label={choice.label}
                  className={styles.patternButton}
                  icon={choice.icon}
                  selected={
                    !fineTuneUnavailable &&
                    pattern.notePlayback === choice.playback
                  }
                  size="md"
                  unavailable={fineTuneUnavailable}
                />
              ))}
            </TactileControlGroup>
          </div>

          <TactileControlGroup
            aria-label="Inner note direction"
            className={styles.noteDirectionControlGroup}
            controlsClassName={styles.noteDirectionControls}
            readout={innerDirectionLabel}
            unavailable={noteDirectionUnavailable}
          >
            {directionChoices.map((choice) => (
              <TactileIconButton
                key={choice.direction}
                onPress={() => setActiveNoteDirection(choice.direction)}
                aria-label={`Notes ${choice.label.toLowerCase()}`}
                className={styles.patternButton}
                icon={choice.icon}
                selected={
                  !noteDirectionUnavailable &&
                  activeNoteDirection === choice.direction
                }
                size="md"
                unavailable={noteDirectionUnavailable}
              />
            ))}
          </TactileControlGroup>
        </div>
      </div>
    </div>
  );
}
