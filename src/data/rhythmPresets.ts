export const RHYTHM_PPQ = 480;

export type PercussionSampleId =
  | "metronome-click"
  | "kick"
  | "snare"
  | "side-stick"
  | "closed-hat"
  | "pedal-hat"
  | "open-hat"
  | "ride"
  | "crash"
  | "tambourine"
  | "shaker"
  | "claves"
  | "high-woodblock"
  | "low-woodblock";

export interface RhythmMeter {
  beatUnit: 4 | 8;
  beats: number;
}

export interface RhythmSwing {
  ratio: number;
  unitTicks: number;
}

export interface RhythmHit {
  atTicks: number;
  sampleId: PercussionSampleId;
  velocity?: number;
}

export interface RhythmPattern {
  cycleTicks: number;
  hits: readonly RhythmHit[];
  meter: RhythmMeter;
  ppq: typeof RHYTHM_PPQ;
  swing?: RhythmSwing;
}

export type RhythmPresetId =
  | "click"
  | "simple-4-4"
  | "waltz-3-4"
  | "six-eight"
  | "swing-4-4"
  | "five-four"
  | "seven-four";

export interface RhythmPreset {
  description: string;
  id: RhythmPresetId;
  label: string;
  pattern: RhythmPattern;
}

const Q = RHYTHM_PPQ;
const E = RHYTHM_PPQ / 2;

function hit(
  atTicks: number,
  sampleId: PercussionSampleId,
  velocity?: number,
): RhythmHit {
  return {
    atTicks,
    sampleId,
    ...(velocity === undefined ? {} : { velocity }),
  };
}

function hats(cycleTicks: number, sampleId: PercussionSampleId = "closed-hat") {
  return Array.from({ length: cycleTicks / E }, (_, index) =>
    hit(index * E, sampleId, index % 2 === 0 ? 0.58 : 0.42),
  );
}

export const rhythmPresets = {
  click: {
    id: "click",
    label: "Click",
    description: "A plain four-beat practice pulse.",
    pattern: {
      cycleTicks: 4 * Q,
      meter: { beats: 4, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "metronome-click", 1),
        hit(Q, "metronome-click", 0.62),
        hit(2 * Q, "metronome-click", 0.62),
        hit(3 * Q, "metronome-click", 0.62),
      ],
    },
  },
  "simple-4-4": {
    id: "simple-4-4",
    label: "Simple 4/4",
    description: "Steady kick, snare, and hat for everyday practice.",
    pattern: {
      cycleTicks: 4 * Q,
      meter: { beats: 4, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "kick", 0.9),
        hit(2 * Q, "kick", 0.72),
        hit(Q, "snare", 0.72),
        hit(3 * Q, "snare", 0.76),
        ...hats(4 * Q),
      ],
    },
  },
  "waltz-3-4": {
    id: "waltz-3-4",
    label: "3/4",
    description: "A clear one-two-three feel.",
    pattern: {
      cycleTicks: 3 * Q,
      meter: { beats: 3, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "kick", 0.82),
        hit(Q, "side-stick", 0.52),
        hit(2 * Q, "side-stick", 0.5),
        ...hats(3 * Q, "closed-hat"),
      ],
    },
  },
  "six-eight": {
    id: "six-eight",
    label: "6/8",
    description: "Two dotted-feel groups over quarter-note tempo.",
    pattern: {
      cycleTicks: 3 * Q,
      meter: { beats: 6, beatUnit: 8 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "kick", 0.86),
        hit(3 * E, "kick", 0.56),
        hit(3 * E, "side-stick", 0.6),
        ...Array.from({ length: 6 }, (_, index) =>
          hit(
            index * E,
            "closed-hat",
            index === 0 || index === 3 ? 0.58 : 0.38,
          ),
        ),
      ],
    },
  },
  "swing-4-4": {
    id: "swing-4-4",
    label: "Swing 4/4",
    description: "A light swung ride pattern with two and four.",
    pattern: {
      cycleTicks: 4 * Q,
      meter: { beats: 4, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      swing: { ratio: 0.6, unitTicks: E },
      hits: [
        hit(0, "kick", 0.68),
        hit(2 * Q, "kick", 0.56),
        hit(Q, "side-stick", 0.58),
        hit(3 * Q, "side-stick", 0.62),
        ...hats(4 * Q, "ride"),
      ],
    },
  },
  "five-four": {
    id: "five-four",
    label: "5/4",
    description: "A steady five-beat grouping for odd-meter practice.",
    pattern: {
      cycleTicks: 5 * Q,
      meter: { beats: 5, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "kick", 0.86),
        hit(3 * Q, "kick", 0.62),
        hit(2 * Q, "snare", 0.64),
        hit(4 * Q, "snare", 0.68),
        ...hats(5 * Q),
      ],
    },
  },
  "seven-four": {
    id: "seven-four",
    label: "7/4",
    description: "A calm seven-beat groove for long phrase practice.",
    pattern: {
      cycleTicks: 7 * Q,
      meter: { beats: 7, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      hits: [
        hit(0, "kick", 0.86),
        hit(3 * Q, "kick", 0.58),
        hit(5 * Q, "kick", 0.6),
        hit(2 * Q, "snare", 0.62),
        hit(6 * Q, "snare", 0.7),
        ...hats(7 * Q),
      ],
    },
  },
} as const satisfies Record<RhythmPresetId, RhythmPreset>;

export const rhythmPresetIds = Object.keys(rhythmPresets) as RhythmPresetId[];

export function getPercussionRegionId(sampleId: PercussionSampleId) {
  return `percussion-${sampleId}`;
}
