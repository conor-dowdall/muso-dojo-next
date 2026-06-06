type AudioParamRampCurve = "exponential" | "linear";

interface AudioParamRamp {
  curve: AudioParamRampCurve;
  endTime: number;
  endValue: number;
  startTime: number;
  startValue: number;
}

function interpolateRamp(ramp: AudioParamRamp, sampleTime: number) {
  if (sampleTime <= ramp.startTime) {
    return ramp.startValue;
  }

  if (sampleTime >= ramp.endTime || ramp.endTime <= ramp.startTime) {
    return ramp.endValue;
  }

  const progress =
    (sampleTime - ramp.startTime) / (ramp.endTime - ramp.startTime);

  if (
    ramp.curve === "exponential" &&
    ramp.startValue > 0 &&
    ramp.endValue > 0
  ) {
    return ramp.startValue * (ramp.endValue / ramp.startValue) ** progress;
  }

  return ramp.startValue + (ramp.endValue - ramp.startValue) * progress;
}

export function createAudioParamAutomation({
  initialValue,
  params,
  startTime,
}: {
  initialValue: number;
  params: readonly AudioParam[];
  startTime: number;
}) {
  let currentValue = initialValue;
  let ramp: AudioParamRamp | undefined;

  params.forEach((param) => param.setValueAtTime(initialValue, startTime));

  const getValueAtTime = (sampleTime: number) =>
    ramp ? interpolateRamp(ramp, sampleTime) : currentValue;

  const holdAtTime = (holdTime: number) => {
    const heldValue = getValueAtTime(holdTime);

    params.forEach((param) => {
      param.cancelScheduledValues(holdTime);
      param.setValueAtTime(heldValue, holdTime);
    });
    currentValue = heldValue;
    ramp = undefined;

    return heldValue;
  };

  const rampToValueAtTime = ({
    curve,
    durationSeconds,
    rampStartTime,
    value,
  }: {
    curve: AudioParamRampCurve;
    durationSeconds: number;
    rampStartTime: number;
    value: number;
  }) => {
    const startValue = holdAtTime(rampStartTime);
    const endTime = rampStartTime + Math.max(0, durationSeconds);

    if (endTime <= rampStartTime || startValue === value) {
      params.forEach((param) => param.setValueAtTime(value, rampStartTime));
      currentValue = value;
      return;
    }

    const resolvedCurve =
      curve === "exponential" && startValue > 0 && value > 0
        ? "exponential"
        : "linear";

    params.forEach((param) => {
      if (resolvedCurve === "exponential") {
        param.exponentialRampToValueAtTime(value, endTime);
      } else {
        param.linearRampToValueAtTime(value, endTime);
      }
    });
    ramp = {
      curve: resolvedCurve,
      endTime,
      endValue: value,
      startTime: rampStartTime,
      startValue,
    };
    currentValue = value;
  };

  return {
    exponentialRampToValueAtTime: (
      value: number,
      rampStartTime: number,
      durationSeconds: number,
    ) =>
      rampToValueAtTime({
        curve: "exponential",
        durationSeconds,
        rampStartTime,
        value,
      }),
    getValueAtTime,
    linearRampToValueAtTime: (
      value: number,
      rampStartTime: number,
      durationSeconds: number,
    ) =>
      rampToValueAtTime({
        curve: "linear",
        durationSeconds,
        rampStartTime,
        value,
      }),
  };
}
