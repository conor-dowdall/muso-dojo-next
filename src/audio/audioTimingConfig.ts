// AudioContext treats a numeric latency hint as a preference, not a guarantee.
export const AUDIO_CONTEXT_LATENCY_HINT_SECONDS = 0.003;

// Main-thread loop scheduling. These affect resilience, not output buffering.
export const AUDIO_SCHEDULER_HORIZON_SECONDS = 0.3;
export const AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS = 0.04;
export const AUDIO_SCHEDULER_TICK_MILLISECONDS = 25;

// Native Web Audio automation safety margins.
export const AUDIO_SCHEDULE_LOOKAHEAD_SECONDS = 0.006;
export const AUDIO_ONE_SHOT_RAMP_RENDER_QUANTA = 2;
