import guitar from "./guitar";
import mandolin from "./mandolin";
import violin from "./violin";
import ukulele from "./ukulele";

const presets = {
  guitar,
  mandolin,
  violin,
  ukulele,
} as const;

export type FretboardPresetName = keyof typeof presets;

export default presets;
