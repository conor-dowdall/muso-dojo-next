import {
  schedulePercussionHit,
  type ScheduledPercussionHit,
} from "./percussion";
import { type LoadedSamplePack } from "./samplePackLibrary";

const REGULAR_CLICK_GAIN = 0.7;
const ACCENT_CLICK_GAIN = 1.2;

export type ScheduledMetronomeClick = ScheduledPercussionHit;

export function scheduleMetronomeClick({
  accent,
  context,
  destination,
  loaded,
  onEnded,
  startTime,
}: {
  accent: boolean;
  context: AudioContext;
  destination: AudioNode;
  loaded: LoadedSamplePack;
  onEnded?: () => void;
  startTime: number;
}): ScheduledMetronomeClick | undefined {
  return schedulePercussionHit({
    context,
    destination,
    loaded,
    onEnded,
    sampleId: "metronome-click",
    startTime,
    velocity: accent ? ACCENT_CLICK_GAIN : REGULAR_CLICK_GAIN,
  });
}
