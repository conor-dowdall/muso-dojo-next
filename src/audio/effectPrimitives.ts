import { normalizeNonNegativeNumber, normalizePositiveNumber } from "./numeric";

export interface AudioEffectInstance {
  dispose: () => void;
  input: AudioNode;
  output: AudioNode;
  tailSeconds: number;
}

export function disconnectAudioNodes(nodes: readonly AudioNode[]) {
  nodes.forEach((node) => node.disconnect());
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeBoundedPositiveNumber({
  fallback,
  max,
  value,
}: {
  fallback: number;
  max: number;
  value: number | undefined;
}) {
  return Math.min(max, normalizePositiveNumber(value, fallback));
}

export function normalizeBoundedNonNegativeNumber({
  fallback,
  max,
  value,
}: {
  fallback: number;
  max: number;
  value: number | undefined;
}) {
  return Math.min(max, normalizeNonNegativeNumber(value, fallback));
}
