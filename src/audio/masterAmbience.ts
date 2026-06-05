import {
  type MasterAmbiencePreset,
  type MasterAmbiencePresetId,
} from "./types";

export const DEFAULT_MASTER_AMBIENCE_PRESET_ID =
  "dry" satisfies MasterAmbiencePresetId;

export const masterAmbiencePresets = {
  dry: {
    description: "Immediate and uncolored.",
    effects: [],
    id: "dry",
    label: "Dry",
  },
  "studio-room": {
    description: "A close, polished room with a natural bloom.",
    effects: [
      {
        type: "reverb",
        decaySeconds: 1.14,
        mix: 0.16,
        preDelaySeconds: 0.012,
        toneHz: 7600,
      },
    ],
    id: "studio-room",
    label: "Studio Room",
  },
  "warm-hall": {
    description: "A warm, longer hall for held harmony and drones.",
    effects: [
      {
        type: "reverb",
        decaySeconds: 2.65,
        mix: 0.22,
        preDelaySeconds: 0.034,
        toneHz: 5200,
      },
    ],
    id: "warm-hall",
    label: "Warm Hall",
  },
  "short-echo": {
    description: "A clear short echo with a small polished tail.",
    effects: [
      {
        type: "delay",
        feedback: 0.22,
        mix: 0.26,
        timeSeconds: 0.12,
      },
      {
        type: "reverb",
        decaySeconds: 0.95,
        mix: 0.12,
        preDelaySeconds: 0.012,
        toneHz: 7800,
      },
    ],
    id: "short-echo",
    label: "Short Echo",
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
