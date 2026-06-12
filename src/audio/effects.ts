import { createChorusEffect, getChorusTailSeconds } from "./chorusEffect";
import { createDelayEffect, getDelayTailSeconds } from "./delayEffect";
import { createDistortionEffect } from "./distortion";
import { type AudioEffectInstance } from "./effectPrimitives";
import { createReverbEffect, getReverbTailSeconds } from "./reverbEffect";
import { type AudioEffectConfig } from "./types";

export type { AudioEffectInstance } from "./effectPrimitives";

export interface ConnectedAudioEffectChain {
  dispose: () => void;
  tailSeconds: number;
}

export function getAudioEffectConfigTailSeconds(config: AudioEffectConfig) {
  switch (config.type) {
    case "chorus":
      return getChorusTailSeconds(config);
    case "delay":
      return getDelayTailSeconds(config);
    case "distortion":
      return 0;
    case "reverb":
      return getReverbTailSeconds(config);
  }
}

export function getAudioEffectChainTailSeconds(
  effects: readonly AudioEffectConfig[],
) {
  return effects.reduce(
    (tailSeconds, effect) =>
      tailSeconds + getAudioEffectConfigTailSeconds(effect),
    0,
  );
}

export function createAudioEffect({
  config,
  context,
}: {
  config: AudioEffectConfig;
  context: AudioContext;
}): AudioEffectInstance | undefined {
  switch (config.type) {
    case "chorus":
      return createChorusEffect({ config, context });
    case "delay":
      return createDelayEffect({ config, context });
    case "distortion":
      return createDistortionEffect({ config, context });
    case "reverb":
      return createReverbEffect({ config, context });
  }
}

export function connectAudioEffectChain({
  context,
  destination,
  effects,
  source,
}: {
  context: AudioContext;
  destination: AudioNode;
  effects: readonly AudioEffectConfig[] | undefined;
  source: AudioNode;
}): ConnectedAudioEffectChain {
  const instances: AudioEffectInstance[] = [];
  let currentOutput = source;

  effects?.forEach((config) => {
    const effect = createAudioEffect({ config, context });

    if (!effect) {
      return;
    }

    currentOutput.connect(effect.input);
    currentOutput = effect.output;
    instances.push(effect);
  });

  currentOutput.connect(destination);

  return {
    dispose: () => instances.forEach((effect) => effect.dispose()),
    tailSeconds: instances.reduce(
      (tailSeconds, effect) => tailSeconds + effect.tailSeconds,
      0,
    ),
  };
}
