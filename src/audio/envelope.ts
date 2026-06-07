import { clampUnit } from "./numeric";
import { type EnvelopeConfig } from "./types";

interface EnvelopeShape {
  attackSeconds: number;
  decaySeconds: number;
  releaseSeconds: number;
  sustainRatio: number;
}

function normalizeDuration(durationSeconds: number) {
  return Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 0;
}

function normalizeEnvelope(
  envelope: EnvelopeConfig,
  minimumAttackSeconds = 0,
): EnvelopeShape {
  return {
    attackSeconds: Math.max(
      Math.max(0, minimumAttackSeconds),
      envelope.attackSeconds,
    ),
    decaySeconds: Math.max(0, envelope.decaySeconds),
    releaseSeconds: Math.max(0, envelope.releaseSeconds),
    sustainRatio: clampUnit(envelope.sustainGain, 1),
  };
}

function getOneShotEnvelopeShape(
  envelope: EnvelopeConfig,
  durationSeconds: number,
  minimumAttackSeconds = 0,
  minimumReleaseSeconds = 0,
): EnvelopeShape {
  const normalizedEnvelope = normalizeEnvelope(envelope, minimumAttackSeconds);
  const safeDurationSeconds = normalizeDuration(durationSeconds);
  const attackSeconds = Math.min(
    normalizedEnvelope.attackSeconds,
    Math.max(0, safeDurationSeconds - minimumReleaseSeconds),
  );
  const remainingSeconds = Math.max(0, safeDurationSeconds - attackSeconds);
  const releaseFloorSeconds = Math.min(
    Math.max(0, minimumReleaseSeconds),
    remainingSeconds,
  );
  const requestedReleaseSeconds = Math.max(
    releaseFloorSeconds,
    normalizedEnvelope.releaseSeconds,
  );
  const requestedFlexibleSeconds =
    normalizedEnvelope.decaySeconds +
    Math.max(0, requestedReleaseSeconds - releaseFloorSeconds);

  if (safeDurationSeconds === 0) {
    return {
      ...normalizedEnvelope,
      attackSeconds: 0,
      decaySeconds: 0,
      releaseSeconds: 0,
    };
  }

  if (requestedFlexibleSeconds <= remainingSeconds - releaseFloorSeconds) {
    return {
      ...normalizedEnvelope,
      attackSeconds,
      releaseSeconds: requestedReleaseSeconds,
    };
  }

  const flexibleScale =
    requestedFlexibleSeconds > 0
      ? Math.max(0, remainingSeconds - releaseFloorSeconds) /
        requestedFlexibleSeconds
      : 0;

  return {
    ...normalizedEnvelope,
    attackSeconds,
    decaySeconds: normalizedEnvelope.decaySeconds * flexibleScale,
    releaseSeconds:
      releaseFloorSeconds +
      Math.max(0, requestedReleaseSeconds - releaseFloorSeconds) *
        flexibleScale,
  };
}

function getAttackDecayGainForShape({
  peakGain,
  sampleTime,
  shape,
  startTime,
}: {
  peakGain: number;
  sampleTime: number;
  shape: EnvelopeShape;
  startTime: number;
}) {
  const sustainGain = peakGain * shape.sustainRatio;
  const attackEnd = startTime + shape.attackSeconds;
  const decayEnd = attackEnd + shape.decaySeconds;

  if (sampleTime < startTime) {
    return 0;
  }

  if (shape.attackSeconds > 0 && sampleTime < attackEnd) {
    return peakGain * ((sampleTime - startTime) / shape.attackSeconds);
  }

  if (shape.decaySeconds > 0 && sampleTime < decayEnd) {
    const progress = (sampleTime - attackEnd) / shape.decaySeconds;
    return peakGain + (sustainGain - peakGain) * progress;
  }

  return sustainGain;
}

function setParamValue(param: AudioParam, value: number, sampleTime: number) {
  param.setValueAtTime(value, sampleTime);
}

function rampParamValue(param: AudioParam, value: number, sampleTime: number) {
  param.linearRampToValueAtTime(value, sampleTime);
}

export function scheduleAttackDecayEnvelope({
  envelope,
  minimumAttackSeconds = 0,
  param,
  peakGain,
  startTime,
}: {
  envelope: EnvelopeConfig;
  minimumAttackSeconds?: number;
  param: AudioParam;
  peakGain: number;
  startTime: number;
}) {
  const shape = normalizeEnvelope(envelope, minimumAttackSeconds);
  const attackEnd = startTime + shape.attackSeconds;
  const decayEnd = attackEnd + shape.decaySeconds;
  const sustainGain = peakGain * shape.sustainRatio;

  param.cancelScheduledValues(startTime);
  setParamValue(param, 0, startTime);

  if (attackEnd > startTime) {
    rampParamValue(param, peakGain, attackEnd);
  } else {
    setParamValue(param, peakGain, startTime);
  }

  if (decayEnd > attackEnd) {
    rampParamValue(param, sustainGain, decayEnd);
  } else {
    setParamValue(param, sustainGain, attackEnd);
  }
}

export function getAttackDecayEnvelopeGainAtTime({
  envelope,
  minimumAttackSeconds = 0,
  peakGain,
  sampleTime,
  startTime,
}: {
  envelope: EnvelopeConfig;
  minimumAttackSeconds?: number;
  peakGain: number;
  sampleTime: number;
  startTime: number;
}) {
  return getAttackDecayGainForShape({
    peakGain,
    sampleTime,
    shape: normalizeEnvelope(envelope, minimumAttackSeconds),
    startTime,
  });
}

export function scheduleOneShotEnvelope({
  durationSeconds,
  envelope,
  minimumAttackSeconds = 0,
  minimumReleaseSeconds = 0,
  param,
  peakGain,
  startTime,
}: {
  durationSeconds: number;
  envelope: EnvelopeConfig;
  minimumAttackSeconds?: number;
  minimumReleaseSeconds?: number;
  param: AudioParam;
  peakGain: number;
  startTime: number;
}) {
  const safeDurationSeconds = normalizeDuration(durationSeconds);
  const shape = getOneShotEnvelopeShape(
    envelope,
    safeDurationSeconds,
    minimumAttackSeconds,
    minimumReleaseSeconds,
  );
  const attackEnd = startTime + shape.attackSeconds;
  const decayEnd = attackEnd + shape.decaySeconds;
  const endTime = startTime + safeDurationSeconds;
  const releaseStart = endTime - shape.releaseSeconds;
  const sustainGain = peakGain * shape.sustainRatio;
  const releaseGain = getAttackDecayGainForShape({
    peakGain,
    sampleTime: releaseStart,
    shape,
    startTime,
  });

  param.cancelScheduledValues(startTime);
  setParamValue(param, 0, startTime);

  if (attackEnd > startTime) {
    rampParamValue(param, peakGain, attackEnd);
  } else {
    setParamValue(param, peakGain, startTime);
  }

  if (decayEnd > attackEnd) {
    rampParamValue(param, sustainGain, decayEnd);
  } else {
    setParamValue(param, sustainGain, attackEnd);
  }

  setParamValue(param, releaseGain, releaseStart);

  if (endTime > releaseStart) {
    rampParamValue(param, 0, endTime);
  } else {
    setParamValue(param, 0, endTime);
  }
}

export function getOneShotEnvelopeGainAtTime({
  durationSeconds,
  envelope,
  minimumAttackSeconds = 0,
  minimumReleaseSeconds = 0,
  peakGain,
  sampleTime,
  startTime,
}: {
  durationSeconds: number;
  envelope: EnvelopeConfig;
  minimumAttackSeconds?: number;
  minimumReleaseSeconds?: number;
  peakGain: number;
  sampleTime: number;
  startTime: number;
}) {
  const safeDurationSeconds = normalizeDuration(durationSeconds);
  const shape = getOneShotEnvelopeShape(
    envelope,
    safeDurationSeconds,
    minimumAttackSeconds,
    minimumReleaseSeconds,
  );
  const endTime = startTime + safeDurationSeconds;
  const releaseStart = endTime - shape.releaseSeconds;

  if (sampleTime < startTime || sampleTime >= endTime) {
    return 0;
  }

  if (shape.releaseSeconds > 0 && sampleTime >= releaseStart) {
    const releaseGain = getAttackDecayGainForShape({
      peakGain,
      sampleTime: releaseStart,
      shape,
      startTime,
    });
    const releaseProgress = (sampleTime - releaseStart) / shape.releaseSeconds;
    return releaseGain * (1 - releaseProgress);
  }

  return getAttackDecayGainForShape({
    peakGain,
    sampleTime,
    shape,
    startTime,
  });
}

export function releaseAudioParam({
  fallbackGain,
  param,
  stopTime,
}: {
  fallbackGain: number;
  param: AudioParam;
  stopTime: number;
}) {
  const holdableParam = param as AudioParam & {
    cancelAndHoldAtTime?: (cancelTime: number) => AudioParam;
  };

  if (holdableParam.cancelAndHoldAtTime) {
    holdableParam.cancelAndHoldAtTime(stopTime);
    return;
  }

  param.cancelScheduledValues(stopTime);
  setParamValue(param, fallbackGain, stopTime);
}
