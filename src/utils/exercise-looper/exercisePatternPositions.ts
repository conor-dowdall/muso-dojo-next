import {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  type ExercisePattern,
  type ExerciseScaleDirection,
} from "./exerciseSequenceTypes";

export function clampExerciseInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function createExtensionPositions(
  anchor: number,
  extensionDegree: number,
) {
  const degree = clampExerciseInteger(
    extensionDegree,
    EXERCISE_INTERVAL_MIN,
    EXERCISE_INTERVAL_MAX,
  );
  const size = Math.floor((degree + 1) / 2);

  return Array.from({ length: size }, (_, index) => anchor + index * 2);
}

export function createScaleAnchors(
  startPosition: number,
  endPosition: number,
  direction: ExerciseScaleDirection,
) {
  const ascending = Array.from(
    { length: endPosition - startPosition + 1 },
    (_, index) => startPosition + index,
  );

  if (direction === "ascending") {
    return ascending;
  }

  if (direction === "descending") {
    return ascending.toReversed();
  }

  if (direction === "down-up") {
    // The next cycle supplies the upper endpoint, avoiding doubled loop beats.
    return [...ascending.toReversed(), ...ascending.slice(1, -1)];
  }

  // The next cycle supplies the lower endpoint, avoiding doubled loop beats.
  return [...ascending, ...ascending.toReversed().slice(1, -1)];
}

function createInnerContour(
  positions: readonly number[],
  direction: ExerciseScaleDirection,
) {
  if (direction === "ascending") {
    return positions;
  }

  if (direction === "descending") {
    return positions.toReversed();
  }

  if (direction === "down-up") {
    return [...positions.toReversed(), ...positions.slice(1)];
  }

  return [...positions, ...positions.toReversed().slice(1)];
}

export function createPatternPositionGroups(
  anchor: number,
  pattern: ExercisePattern,
) {
  switch (pattern.mode) {
    case "single":
      return [[anchor]];
    case "interval": {
      const positions = [
        anchor,
        anchor +
          clampExerciseInteger(
            pattern.intervalDegree,
            EXERCISE_INTERVAL_MIN,
            EXERCISE_INTERVAL_MAX,
          ) -
          1,
      ];

      return pattern.notePlayback === "together"
        ? [positions]
        : createInnerContour(positions, pattern.intervalDirection).map(
            (position) => [position],
          );
    }
    case "extension": {
      const positions = createExtensionPositions(
        anchor,
        pattern.extensionDegree,
      );

      return pattern.notePlayback === "together"
        ? [positions]
        : createInnerContour(positions, pattern.extensionDirection).map(
            (position) => [position],
          );
    }
  }
}
