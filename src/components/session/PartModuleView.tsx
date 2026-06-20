"use client";

import { useAppStore } from "@/stores/appStore";
import { assertNever } from "@/utils/assertNever";
import { DronePartModuleView } from "./DronePartModuleView";
import { InstrumentPartModuleView } from "./InstrumentPartModuleView";
import { ExerciseLooperPartModuleView } from "./ExerciseLooperPartModuleView";
import { RhythmPartModuleView } from "./RhythmPartModuleView";
import { selectPartModule } from "./sessionSelectors";

interface PartModuleViewProps {
  sessionId: string;
  partId: string;
  moduleId: string;
  isPerformanceMode?: boolean;
  onOpenSessionTempo?: (sessionId: string) => void;
}

export function PartModuleView({
  sessionId,
  partId,
  moduleId,
  isPerformanceMode = false,
  onOpenSessionTempo,
}: PartModuleViewProps) {
  const moduleType = useAppStore(
    (state) => selectPartModule(state, sessionId, partId, moduleId)?.type,
  );

  switch (moduleType) {
    case undefined:
      return null;
    case "drone":
      return (
        <DronePartModuleView
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
        />
      );
    case "instrument":
      return (
        <InstrumentPartModuleView
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
        />
      );
    case "exercise-looper":
      return (
        <ExerciseLooperPartModuleView
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
          onOpenSessionTempo={onOpenSessionTempo}
        />
      );
    case "rhythm":
      return (
        <RhythmPartModuleView
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
          onOpenSessionTempo={onOpenSessionTempo}
        />
      );
    default:
      return assertNever(moduleType, "Unsupported part module type");
  }
}
