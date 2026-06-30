export type PlaybackOwner = "manual" | "part-sequence";

export function getPlaybackOwnerForSource(source: PlaybackOwner | undefined) {
  return source ?? "manual";
}
