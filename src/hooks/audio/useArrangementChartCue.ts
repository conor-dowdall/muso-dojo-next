"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  partSequenceCoordinator,
  type PartSequencePlaybackPlan,
} from "@/audio";
import {
  deriveArrangementChartCueTarget,
  type ArrangementChartCueTarget,
} from "@/utils/arrangement/arrangementChartCue";

export type ArrangementChartPresentation =
  | {
      kind: "current";
      entryId: string;
      sectionId: string;
      activeSourcePartId?: string;
    }
  | {
      kind: "upcoming";
      entryId: string;
      sectionId: string;
      boundaryTime: number;
    };

function targetsMatch(
  left: ArrangementChartCueTarget | undefined,
  right: ArrangementChartCueTarget | undefined,
) {
  return (
    left?.sectionId === right?.sectionId &&
    left?.entryId === right?.entryId &&
    left?.boundaryTime === right?.boundaryTime &&
    left?.sourceSignature === right?.sourceSignature
  );
}

export function useArrangementChartCue(
  plan: PartSequencePlaybackPlan | undefined,
  fallback: { entryId: string; sectionId: string } | undefined,
): {
  presentation: ArrangementChartPresentation | undefined;
  upNextEntryId?: string;
} {
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const activeContext = snapshot.activeArrangementContext;
  const [sectionRun, setSectionRun] = useState<{
    sectionId?: string;
    startedAt?: number;
  }>({});
  const visibleTarget = useRef<ArrangementChartCueTarget | undefined>(
    undefined,
  );
  const [upcoming, setUpcoming] = useState<
    ArrangementChartCueTarget | undefined
  >(undefined);

  useEffect(() => {
    const nextSectionId =
      snapshot.playing && snapshot.mode === "arrangement"
        ? activeContext?.sectionId
        : undefined;
    if (nextSectionId === sectionRun.sectionId) return;
    const timer = globalThis.setTimeout(() => {
      visibleTarget.current = undefined;
      setSectionRun(
        nextSectionId
          ? {
              sectionId: nextSectionId,
              startedAt:
                snapshot.originTime ?? partSequenceCoordinator.getClockTime(),
            }
          : {},
      );
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [
    activeContext?.sectionId,
    sectionRun.sectionId,
    snapshot.mode,
    snapshot.originTime,
    snapshot.playing,
  ]);

  const target = useMemo(() => {
    if (
      !plan ||
      sectionRun.startedAt === undefined ||
      snapshot.sourceSignature !== plan.sourceSignature
    ) {
      return undefined;
    }
    return deriveArrangementChartCueTarget({
      plan,
      snapshot,
      currentSectionStartedAt: sectionRun.startedAt,
    });
  }, [plan, sectionRun.startedAt, snapshot]);

  useEffect(() => {
    if (!snapshot.playing || snapshot.mode !== "arrangement" || !target) {
      return;
    }
    if (targetsMatch(visibleTarget.current, target)) {
      return;
    }

    const currentTime = partSequenceCoordinator.getClockTime();
    if (currentTime === undefined) return;
    const showTarget = () => {
      const live = partSequenceCoordinator.getSnapshot();
      if (
        live.playing &&
        live.mode === "arrangement" &&
        live.sourceSignature === target.sourceSignature &&
        live.activeOccurrence === target.fromOccurrence &&
        live.activeArrangementContext?.sectionId !== target.sectionId
      ) {
        visibleTarget.current = target;
        setUpcoming(target);
      }
    };
    if (target.cueTime <= currentTime) {
      showTarget();
      return;
    }
    const timer = globalThis.setTimeout(
      showTarget,
      (target.cueTime - currentTime) * 1000,
    );
    return () => globalThis.clearTimeout(timer);
  }, [snapshot.mode, snapshot.playing, target]);

  if (
    upcoming &&
    target &&
    targetsMatch(upcoming, target) &&
    snapshot.playing &&
    snapshot.mode === "arrangement" &&
    snapshot.activeArrangementContext?.sectionId !== upcoming.sectionId
  ) {
    return {
      presentation: {
        kind: "upcoming",
        entryId: upcoming.entryId,
        sectionId: upcoming.sectionId,
        boundaryTime: upcoming.boundaryTime,
      },
      upNextEntryId: upcoming.entryId,
    };
  }
  if (snapshot.playing && activeContext) {
    return {
      presentation: {
        kind: "current",
        entryId: activeContext.entryId,
        sectionId: activeContext.sectionId,
        activeSourcePartId: snapshot.activeSourcePartId,
      },
    };
  }
  return fallback
    ? {
        presentation: {
          kind: "current",
          entryId: fallback.entryId,
          sectionId: fallback.sectionId,
        },
      }
    : { presentation: undefined };
}
