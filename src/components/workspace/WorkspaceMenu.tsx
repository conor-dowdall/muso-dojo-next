"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { WorkspaceManagementDialog } from "./WorkspaceManagementDialog";

export function WorkspaceMenu() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = () => setIsDialogOpen(false);

  return (
    <>
      <IconButton
        aria-label="Workspace menu"
        icon={<MoreHorizontal />}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      />

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} size="lg">
        <WorkspaceManagementDialog onClose={closeDialog} />
      </Dialog>
    </>
  );
}
