// Main-thread loop scheduling. These affect resilience, not output buffering.
// Keep enough audio-clock runway for an expensive view transition or layout
// pass on a low-powered device without scheduling an excessive number of
// short-lived Web Audio nodes.
export const AUDIO_SCHEDULER_HORIZON_SECONDS = 1.25;
export const AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS = 0.04;
export const AUDIO_SCHEDULER_TICK_MILLISECONDS = 25;
export const AUDIO_PLAYBACK_START_LEAD_SECONDS = 0.08;
