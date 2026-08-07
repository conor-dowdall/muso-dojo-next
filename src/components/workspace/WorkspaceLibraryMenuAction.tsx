"use client";

import { LibraryBig } from "lucide-react";
import { DisclosureListAction } from "@/components/ui/disclosure-list/DisclosureList";

const WORKSPACE_LIBRARY_LABEL = "Library";
const WORKSPACE_LIBRARY_SUBTITLE = "Sessions, Arrangements, and Resources";

export function WorkspaceLibraryMenuAction({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <DisclosureListAction
      icon={<LibraryBig />}
      label={WORKSPACE_LIBRARY_LABEL}
      subtitle={WORKSPACE_LIBRARY_SUBTITLE}
      onClick={onClick}
    />
  );
}
