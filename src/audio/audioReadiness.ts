import { musoAudioEngine } from "./createWebAudioEngine";
import { type AudioEngine } from "./types";

export type AudioReadinessStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "unavailable";

export interface EnsureAudioReadyOptions {
  feedback?: "silent" | "visible";
}

export interface AudioReadinessSnapshot {
  attemptRevision: number;
  feedbackAttemptRevision: number | null;
  revision: number;
  status: AudioReadinessStatus;
}

type AudioReadinessEngine = Pick<AudioEngine, "isSupported" | "prime">;

const SILENT_AUDIO_FEEDBACK_GRACE_MS = 900;

interface SilentFeedbackWindow {
  attemptRevision: number;
  expiresAt: number;
}

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export function createAudioReadinessController(
  engine: AudioReadinessEngine = musoAudioEngine,
) {
  let snapshot: AudioReadinessSnapshot = {
    attemptRevision: 0,
    feedbackAttemptRevision: null,
    revision: 0,
    status: "idle",
  };
  let preparePromise: Promise<boolean> | undefined;
  let delayedFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let silentFeedbackWindow: SilentFeedbackWindow | undefined;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const clearDelayedFeedbackTimer = () => {
    if (delayedFeedbackTimer !== undefined) {
      clearTimeout(delayedFeedbackTimer);
      delayedFeedbackTimer = undefined;
    }
  };

  const clearSilentFeedbackWindow = () => {
    clearDelayedFeedbackTimer();
    silentFeedbackWindow = undefined;
  };

  const commitSnapshot = ({
    attemptRevision = snapshot.attemptRevision,
    feedbackAttemptRevision = snapshot.feedbackAttemptRevision,
    status = snapshot.status,
  }: Partial<Omit<AudioReadinessSnapshot, "revision">>) => {
    if (
      snapshot.attemptRevision === attemptRevision &&
      snapshot.feedbackAttemptRevision === feedbackAttemptRevision &&
      snapshot.status === status
    ) {
      return;
    }

    snapshot = {
      attemptRevision,
      feedbackAttemptRevision,
      revision: snapshot.revision + 1,
      status,
    };
    emit();
  };

  const beginAttempt = (
    status: Exclude<AudioReadinessStatus, "idle" | "ready">,
    shouldRequestFeedback: boolean,
  ) => {
    const attemptRevision = snapshot.attemptRevision + 1;

    clearSilentFeedbackWindow();
    if (!shouldRequestFeedback) {
      silentFeedbackWindow = {
        attemptRevision,
        expiresAt: getNow() + SILENT_AUDIO_FEEDBACK_GRACE_MS,
      };
    }

    commitSnapshot({
      attemptRevision,
      feedbackAttemptRevision: shouldRequestFeedback ? attemptRevision : null,
      status,
    });
  };

  const promoteCurrentAttemptToFeedback = (attemptRevision: number) => {
    if (
      snapshot.status === "idle" ||
      snapshot.status === "ready" ||
      snapshot.attemptRevision !== attemptRevision ||
      snapshot.feedbackAttemptRevision === attemptRevision
    ) {
      return;
    }

    clearSilentFeedbackWindow();
    commitSnapshot({
      feedbackAttemptRevision: attemptRevision,
    });
  };

  const scheduleDelayedFeedbackPromotion = (
    attemptRevision: number,
    delayMs: number,
  ) => {
    if (delayedFeedbackTimer !== undefined) {
      return;
    }

    delayedFeedbackTimer = setTimeout(() => {
      delayedFeedbackTimer = undefined;
      promoteCurrentAttemptToFeedback(attemptRevision);
    }, delayMs);
  };

  const getRemainingSilentFeedbackDelayMs = () => {
    if (silentFeedbackWindow?.attemptRevision !== snapshot.attemptRevision) {
      return 0;
    }

    return Math.max(0, silentFeedbackWindow.expiresAt - getNow());
  };

  const requestFeedbackForCurrentAttempt = () => {
    if (
      snapshot.status === "idle" ||
      snapshot.status === "ready" ||
      snapshot.feedbackAttemptRevision === snapshot.attemptRevision
    ) {
      return;
    }

    const remainingSilentDelayMs = getRemainingSilentFeedbackDelayMs();

    if (remainingSilentDelayMs > 0) {
      scheduleDelayedFeedbackPromotion(
        snapshot.attemptRevision,
        remainingSilentDelayMs,
      );
      return;
    }

    promoteCurrentAttemptToFeedback(snapshot.attemptRevision);
  };

  const setStatus = (status: AudioReadinessStatus) => {
    if (status === "idle" || status === "ready") {
      clearSilentFeedbackWindow();
    }

    commitSnapshot({ status });
  };

  const ensureReady = (options: EnsureAudioReadyOptions = {}) => {
    const shouldRequestFeedback = options.feedback !== "silent";

    if (snapshot.status === "ready") {
      return Promise.resolve(true);
    }

    if (preparePromise) {
      if (shouldRequestFeedback) {
        requestFeedbackForCurrentAttempt();
      }

      return preparePromise;
    }

    if (!engine.isSupported()) {
      if (snapshot.status === "unavailable") {
        if (shouldRequestFeedback) {
          requestFeedbackForCurrentAttempt();
        }
      } else {
        beginAttempt("unavailable", shouldRequestFeedback);
      }

      return Promise.resolve(false);
    }

    beginAttempt("preparing", shouldRequestFeedback);
    preparePromise = engine
      .prime()
      .then((ready) => {
        setStatus(ready ? "ready" : "unavailable");
        return ready;
      })
      .catch(() => {
        setStatus("unavailable");
        return false;
      })
      .finally(() => {
        preparePromise = undefined;
      });

    return preparePromise;
  };

  return {
    ensureReady,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const audioReadiness = createAudioReadinessController();

export const ensureAudioReady = audioReadiness.ensureReady;
