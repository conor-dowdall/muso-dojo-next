"use client";

import styles from "./page.module.css";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceLoader } from "@/components/workspace/WorkspaceLoader";
import { WorkspaceView } from "@/components/workspace/WorkspaceView";
import { useAppStore, useHydrateAppStore } from "@/stores/appStore";

function HydratedWorkspace() {
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);

  return (
    <>
      <WorkspaceHeader />
      <WorkspaceView workspaceId={activeWorkspaceId} />
    </>
  );
}

function WorkspaceLoadingFallback() {
  return <WorkspaceLoader />;
}

export default function DojoWorkspacePage() {
  const hasHydrated = useHydrateAppStore();

  return (
    <div
      className={`${styles.container} ${hasHydrated ? styles.hydrated : ""}`}
    >
      {hasHydrated ? <HydratedWorkspace /> : <WorkspaceLoadingFallback />}
    </div>
  );
}
