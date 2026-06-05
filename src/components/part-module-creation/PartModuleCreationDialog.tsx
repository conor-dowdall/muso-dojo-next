"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogContentSection,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { type AddPartModulesHandler } from "@/types/session";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import {
  ModuleCreationList,
  type ModuleCreationListDraft,
} from "@/components/part-module-creation/ModuleCreationList";
import { type ModuleCreationKind } from "@/types/instrument-creation-defaults";
import { getModuleCreationKindLabel } from "@/components/part-module-creation/moduleCreationOptions";

interface PartModuleCreationDialogProps {
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onAddPartModules: AddPartModulesHandler;
  onClose: () => void;
  title?: string;
}

const emptyDraft = {
  moduleKinds: [],
  moduleRequests: [],
} satisfies ModuleCreationListDraft;

function getAddLabel(moduleKinds: readonly ModuleCreationKind[]) {
  if (moduleKinds.length === 0) {
    return "Add Modules";
  }

  if (moduleKinds.length === 1) {
    return `Add ${getModuleCreationKindLabel(moduleKinds[0])}`;
  }

  return `Add ${moduleKinds.length} Modules`;
}

export function PartModuleCreationDialog({
  instrumentCreationRangeContext,
  onAddPartModules,
  onClose,
  title = "Add to Part",
}: PartModuleCreationDialogProps) {
  const [draft, setDraft] = useState<ModuleCreationListDraft>(emptyDraft);
  const rememberModuleCreation = useAppStore(
    (state) => state.rememberModuleCreation,
  );
  const canAddModules = draft.moduleRequests.length > 0;
  const addLabel = getAddLabel(draft.moduleKinds);

  const handleAddPartModule = () => {
    if (!canAddModules) {
      return;
    }

    onAddPartModules(draft.moduleRequests);
    rememberModuleCreation({
      moduleKinds: draft.moduleKinds,
      ...(draft.fretboard ? { fretboard: draft.fretboard } : {}),
      ...(draft.keyboard ? { keyboard: draft.keyboard } : {}),
    });
    onClose();
  };

  return (
    <>
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Modules">
          <ModuleCreationList
            instrumentCreationRangeContext={instrumentCreationRangeContext}
            onDraftChange={setDraft}
          />
        </DialogContentSection>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          <DialogFooterActionGroup placement="primary">
            <Button
              disabled={!canAddModules}
              label={addLabel}
              size="lg"
              variant="filled"
              onClick={handleAddPartModule}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </>
  );
}
