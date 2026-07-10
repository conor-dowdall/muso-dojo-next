import { exercisePlaybackCoordinator } from "./exercisePlaybackCoordinator";
import { musoAudioEngine } from "./createWebAudioEngine";
import { partSequenceCoordinator } from "./partSequenceCoordinator";
import { rhythmPlaybackCoordinator } from "./rhythmPlaybackCoordinator";

export function isAudioPlaybackActive() {
  const partSequenceSnapshot = partSequenceCoordinator.getSnapshot();
  const exerciseSnapshot = exercisePlaybackCoordinator.getSnapshot();
  const rhythmSnapshot = rhythmPlaybackCoordinator.getSnapshot();

  return (
    partSequenceSnapshot.playing ||
    exerciseSnapshot.playing ||
    exerciseSnapshot.pendingIds.length > 0 ||
    rhythmSnapshot.playing ||
    rhythmSnapshot.pendingIds.length > 0 ||
    musoAudioEngine.hasActivePlayback()
  );
}

export function stopAllAudioPlayback() {
  const wasActive = isAudioPlaybackActive();

  partSequenceCoordinator.stop({ stopPlayback: false });
  exercisePlaybackCoordinator.stop();
  rhythmPlaybackCoordinator.stop();
  musoAudioEngine.stopAll();

  return wasActive;
}
