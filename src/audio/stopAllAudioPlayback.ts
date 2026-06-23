import { exercisePlaybackCoordinator } from "./exercisePlaybackCoordinator";
import { musoAudioEngine } from "./createWebAudioEngine";
import { partSequenceCoordinator } from "./partSequenceCoordinator";
import { rhythmPlaybackCoordinator } from "./rhythmPlaybackCoordinator";

export function stopAllAudioPlayback() {
  partSequenceCoordinator.stop({ stopPlayback: false });
  exercisePlaybackCoordinator.stop();
  rhythmPlaybackCoordinator.stop();
  musoAudioEngine.stopAll();
}
