"use client";

import { LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ensureAudioReady, type AudioReadinessStatus } from "@/audio";
import { useAudioReadinessSnapshot } from "@/hooks/audio/useAudioReadinessSnapshot";
import styles from "./AudioStatusViewport.module.css";

const PREPARING_VISIBLE_DELAY_MS = 180;
const READY_VISIBLE_MS = 900;

type VisibleAudioStatus = Exclude<AudioReadinessStatus, "idle">;

const statusCopy = {
  preparing: "Preparing Sound",
  ready: "Sound Ready",
  unavailable: "Sound Unavailable",
} as const satisfies Record<VisibleAudioStatus, string>;

function getStatusIcon(status: VisibleAudioStatus) {
  switch (status) {
    case "preparing":
      return <LoaderCircle />;
    case "ready":
      return <Volume2 />;
    case "unavailable":
      return <VolumeX />;
  }
}

export function AudioStatusViewport() {
  const { attemptRevision, feedbackAttemptRevision, status } =
    useAudioReadinessSnapshot();
  const [visibleStatus, setVisibleStatus] = useState<VisibleAudioStatus | null>(
    null,
  );
  const preparingWasVisible = useRef(false);
  const shouldShowFeedback =
    status !== "idle" && feedbackAttemptRevision === attemptRevision;

  useEffect(() => {
    let preparingTimer: number | undefined;
    let readyTimer: number | undefined;
    let statusTimer: number | undefined;

    const setVisibleStatusSoon = (nextStatus: VisibleAudioStatus | null) => {
      statusTimer = window.setTimeout(() => {
        setVisibleStatus(nextStatus);
      }, 0);
    };

    if (!shouldShowFeedback) {
      preparingWasVisible.current = false;
      setVisibleStatusSoon(null);
    } else if (status === "preparing") {
      preparingWasVisible.current = false;
      preparingTimer = window.setTimeout(() => {
        preparingWasVisible.current = true;
        setVisibleStatus("preparing");
      }, PREPARING_VISIBLE_DELAY_MS);
    } else if (status === "ready") {
      if (preparingWasVisible.current) {
        setVisibleStatusSoon("ready");
        readyTimer = window.setTimeout(() => {
          setVisibleStatus(null);
          preparingWasVisible.current = false;
        }, READY_VISIBLE_MS);
      } else {
        setVisibleStatusSoon(null);
      }
    } else if (status === "unavailable") {
      preparingWasVisible.current = false;
      setVisibleStatusSoon("unavailable");
    } else {
      preparingWasVisible.current = false;
      setVisibleStatusSoon(null);
    }

    return () => {
      if (preparingTimer !== undefined) {
        window.clearTimeout(preparingTimer);
      }
      if (readyTimer !== undefined) {
        window.clearTimeout(readyTimer);
      }
      if (statusTimer !== undefined) {
        window.clearTimeout(statusTimer);
      }
    };
  }, [shouldShowFeedback, status]);

  if (!visibleStatus) {
    return null;
  }

  const content = (
    <>
      <span className={styles.icon} aria-hidden="true">
        {getStatusIcon(visibleStatus)}
      </span>
      <span>{statusCopy[visibleStatus]}</span>
    </>
  );

  return (
    <div className={styles.viewport}>
      {visibleStatus === "unavailable" ? (
        <button
          aria-label="Retry sound"
          className={styles.pill}
          data-status={visibleStatus}
          type="button"
          onClick={() => {
            void ensureAudioReady();
          }}
        >
          {content}
        </button>
      ) : (
        <div
          aria-live="polite"
          className={styles.pill}
          data-status={visibleStatus}
          role="status"
        >
          {content}
        </div>
      )}
    </div>
  );
}
