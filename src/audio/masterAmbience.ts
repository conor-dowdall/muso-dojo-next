import {
  type MasterAmbiencePreset,
  type MasterAmbiencePresetId,
} from "./types";

export const DEFAULT_MASTER_AMBIENCE_PRESET_ID =
  "dojo-room" satisfies MasterAmbiencePresetId;

export const masterAmbiencePresets = {
  dry: {
    description: "Immediate and uncolored.",
    effects: [],
    id: "dry",
    label: "Dry",
  },
  "dojo-room": {
    description: "A small, clear room that keeps note practice focused.",
    effects: [
      {
        type: "reverb",
        decaySeconds: 0.82,
        mix: 0.1,
        preDelaySeconds: 0.012,
        toneHz: 7200,
      },
    ],
    id: "dojo-room",
    label: "Dojo Room",
  },
  "warm-hall": {
    description: "A wider tail for held harmony and drones.",
    effects: [
      {
        type: "reverb",
        decaySeconds: 2.35,
        mix: 0.18,
        preDelaySeconds: 0.028,
        toneHz: 5600,
      },
    ],
    id: "warm-hall",
    label: "Warm Hall",
  },
  "soft-echo": {
    description: "A gentle repeat with a little shared room.",
    effects: [
      {
        type: "delay",
        feedback: 0.24,
        mix: 0.11,
        timeSeconds: 0.28,
      },
      {
        type: "reverb",
        decaySeconds: 1.35,
        mix: 0.12,
        preDelaySeconds: 0.018,
        toneHz: 6400,
      },
    ],
    id: "soft-echo",
    label: "Soft Echo",
  },
} as const satisfies Record<MasterAmbiencePresetId, MasterAmbiencePreset>;

export function getMasterAmbiencePreset(presetId: MasterAmbiencePresetId) {
  return masterAmbiencePresets[presetId];
}

export function isMasterAmbiencePresetId(
  value: unknown,
): value is MasterAmbiencePresetId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(masterAmbiencePresets, value)
  );
}

export function resolveMasterAmbiencePresetId(
  value: unknown,
): MasterAmbiencePresetId {
  return isMasterAmbiencePresetId(value)
    ? value
    : DEFAULT_MASTER_AMBIENCE_PRESET_ID;
}
