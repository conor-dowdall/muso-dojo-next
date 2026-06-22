import { exercisePlaybackCoordinator } from "./exercisePlaybackCoordinator";
import { musoAudioEngine } from "./createWebAudioEngine";
import { rhythmPlaybackCoordinator } from "./rhythmPlaybackCoordinator";

export function stopAllAudioPlayback() {
  exercisePlaybackCoordinator.stop();
  rhythmPlaybackCoordinator.stop();
  musoAudioEngine.stopAll();
}
