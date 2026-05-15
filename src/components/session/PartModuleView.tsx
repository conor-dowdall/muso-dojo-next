"use client";

import { useAppStore } from "@/stores/appStore";
import { assertNever } from "@/utils/assertNever";
import { InstrumentPartModuleView } from "./InstrumentPartModuleView";
import { selectPartModule } from "./sessionSelectors";

interface PartModuleViewProps {
  sessionId: string;
  partId: string;
  moduleId: string;
  isPerformanceMode?: boolean;
}

export function PartModuleView({
  sessionId,
  partId,
  moduleId,
  isPerformanceMode = false,
}: PartModuleViewProps) {
  const moduleType = useAppStore(
    (state) => selectPartModule(state, sessionId, partId, moduleId)?.type,
  );

  switch (moduleType) {
    case undefined:
      return null;
    case "instrument":
      return (
        <InstrumentPartModuleView
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
        />
      );
    default:
      return assertNever(moduleType, "Unsupported part module type");
  }
}
