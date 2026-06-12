import { type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  Merge,
  Minus,
  Plus,
  Split,
} from "lucide-react";
import { TactileIconButton } from "@/components/ui/buttons/TactileButton";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { getExerciseDegreeOptions } from "@/utils/exercise-looper/exerciseConfig";
import {
  getExerciseIntervalLabel,
  type ExerciseNotePlayback,
  type ExercisePattern,
  type ExercisePatternMode,
  type ExerciseScaleDirection,
} from "@/utils/exercise-looper/exerciseSequence";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import styles from "./ExerciseLooperModule.module.css";

function getCompactDirectionLabel(direction: ExerciseScaleDirection) {
  switch (direction) {
    case "ascending":
      return "Up";
    case "descending":
      return "Down";
    case "up-down":
      return `Up${DISPLAY_VALUE_SEPARATOR}Down`;
  }
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
    icon: <GitCommitHorizontal />,
    label: "Single notes",
    mode: "single",
    readout: "Single Notes",
  },
  {
    icon: <GitBranch />,
    label: "Play an interval from each note",
    mode: "interval",
    readout: "Intervals",
  },
  {
    icon: <GitFork />,
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

export function ExercisePatternControls({
  onChange,
  pattern,
  supportsTertianExercises,
}: {
  onChange?: (pattern: ExercisePattern) => void;
  pattern: ExercisePattern;
  supportsTertianExercises: boolean;
}) {
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
      : pattern.mode === "extension"
        ? pattern.extensionDirection
        : undefined;
  const activeDegreeLabel =
    pattern.mode === "interval"
      ? getExerciseIntervalLabel(pattern.intervalDegree)
      : pattern.mode === "extension"
        ? getExerciseIntervalLabel(pattern.extensionDegree)
        : "";
  const notePlaybackLabel =
    pattern.mode === "single"
      ? ""
      : pattern.notePlayback === "separate"
        ? "Separate"
        : "Together";
  const innerDirectionLabel =
    activeNoteDirection === undefined
      ? ""
      : getCompactDirectionLabel(activeNoteDirection);
  const fineTuneUnavailable = pattern.mode === "single";
  const patternModeLabel =
    patternModeChoices.find((choice) => choice.mode === pattern.mode)
      ?.readout ?? "Single Notes";
  const canDecreaseActiveDegree =
    pattern.mode === "interval"
      ? canDecreaseIntervalDegree
      : pattern.mode === "extension" && canDecreaseExtensionDegree;
  const canIncreaseActiveDegree =
    pattern.mode === "interval"
      ? canIncreaseIntervalDegree
      : pattern.mode === "extension" && canIncreaseExtensionDegree;
  const noteDirectionUnavailable =
    pattern.mode === "single" ||
    pattern.notePlayback === "together" ||
    (pattern.mode === "extension" && !supportsTertianExercises);

  const updatePattern = (patch: Partial<ExercisePattern>) => {
    onChange?.({ ...pattern, ...patch });
  };

  const setPatternMode = (mode: ExercisePatternMode) => {
    if (mode === "extension" && !supportsTertianExercises) {
      return;
    }

    updatePattern({ mode });
  };

  const stepActiveDegree = (offset: -1 | 1) => {
    if (pattern.mode === "interval") {
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
    if (pattern.mode === "interval") {
      updatePattern({ intervalDirection: direction });
    } else if (pattern.mode === "extension") {
      updatePattern({ extensionDirection: direction });
    }
  };

  return (
    <div
      className={styles.patternControls}
      role="group"
      aria-label="Exercise pattern"
    >
      <TactileControlGroup
        aria-label="Direction"
        controlsClassName={styles.directionControls}
      >
        {directionChoices.map((choice) => (
          <TactileIconButton
            key={choice.direction}
            onPress={() => updatePattern({ direction: choice.direction })}
            aria-label={choice.label}
            className={styles.directionButton}
            icon={choice.icon}
            selected={pattern.direction === choice.direction}
            size="lg"
          />
        ))}
      </TactileControlGroup>

      <div className={styles.modeConfiguration}>
        <TactileControlGroup
          aria-label="Play mode"
          controlsClassName={styles.modeControls}
          readout={patternModeLabel}
        >
          {patternModeChoices.map((choice) => (
            <TactileIconButton
              key={choice.mode}
              onPress={() => setPatternMode(choice.mode)}
              aria-label={choice.label}
              className={styles.modeButton}
              icon={choice.icon}
              selected={pattern.mode === choice.mode}
              size="lg"
              unavailable={
                choice.mode === "extension" && !supportsTertianExercises
              }
            />
          ))}
        </TactileControlGroup>

        <div className={styles.fineTuneControls}>
          <div
            className={styles.degreeAndPlaybackControls}
            role="group"
            aria-label="Pattern detail"
          >
            <TactileControlGroup
              aria-label="Interval or chord size"
              controlsClassName={styles.degreeControls}
              readout={activeDegreeLabel}
              unavailable={fineTuneUnavailable}
            >
              <TactileIconButton
                onPress={() => stepActiveDegree(-1)}
                aria-label="Decrease interval or chord size"
                className={`${styles.patternButton} ${styles.degreeButton}`}
                icon={<Minus />}
                size="md"
                unavailable={!canDecreaseActiveDegree}
              />
              <TactileIconButton
                onPress={() => stepActiveDegree(1)}
                aria-label="Increase interval or chord size"
                className={`${styles.patternButton} ${styles.degreeButton}`}
                icon={<Plus />}
                size="md"
                unavailable={!canIncreaseActiveDegree}
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
                    pattern.mode !== "single" &&
                    pattern.notePlayback === choice.playback
                  }
                  size="md"
                  unavailable={pattern.mode === "single"}
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
                  pattern.notePlayback === "separate" &&
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
