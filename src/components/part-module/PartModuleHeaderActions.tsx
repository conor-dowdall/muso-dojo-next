import { type ReactNode } from "react";
import { ControlHeaderCluster } from "@/components/ui/control-header/ControlHeader";

export function PartModuleHeaderActions({
  controls,
  utility,
}: {
  controls?: ReactNode;
  utility?: ReactNode;
}) {
  return (
    <ControlHeaderCluster gap="cluster">
      {controls}
      {utility}
    </ControlHeaderCluster>
  );
}
