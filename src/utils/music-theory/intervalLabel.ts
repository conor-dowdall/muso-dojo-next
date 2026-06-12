const DIATONIC_STEPS_PER_OCTAVE = 7;

export function shiftIntervalLabelByOctaves(
  intervalLabel: string,
  octaveOffset: number,
) {
  if (octaveOffset === 0) {
    return intervalLabel;
  }

  const match = intervalLabel.match(/^([^\d]*)(\d+)$/);

  if (!match) {
    return intervalLabel;
  }

  const [, accidental = "", degree] = match;
  const intervalNumber = Number(degree);

  if (!Number.isFinite(intervalNumber)) {
    return intervalLabel;
  }

  return `${accidental}${intervalNumber + octaveOffset * DIATONIC_STEPS_PER_OCTAVE}`;
}
