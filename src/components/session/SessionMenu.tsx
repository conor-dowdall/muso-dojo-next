"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { SessionManagementDialog } from "./SessionManagementDialog";

export function SessionMenu() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = () => setIsDialogOpen(false);

  return (
    <>
      <IconButton
        aria-label="Session menu"
        icon={<MoreHorizontal />}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      />

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} size="lg">
        <SessionManagementDialog onClose={closeDialog} />
      </Dialog>
    </>
  );
}
