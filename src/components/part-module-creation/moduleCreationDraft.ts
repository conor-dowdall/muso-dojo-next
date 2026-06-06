import {
  type DroneModuleCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationKind,
  type RememberModuleCreationRequest,
} from "@/types/instrument-creation-defaults";
import { type PartModuleCreationRequest } from "@/types/session";

export interface ModuleCreationListDraft {
  drone?: DroneModuleCreationDefault;
  fretboard?: FretboardModuleCreationDefault;
  keyboard?: KeyboardModuleCreationDefault;
  moduleKinds: ModuleCreationKind[];
  moduleRequests: PartModuleCreationRequest[];
}

export function createRememberModuleCreationRequest(
  draft: ModuleCreationListDraft,
): RememberModuleCreationRequest {
  return {
    moduleKinds: draft.moduleKinds,
    ...(draft.drone ? { drone: draft.drone } : {}),
    ...(draft.fretboard ? { fretboard: draft.fretboard } : {}),
    ...(draft.keyboard ? { keyboard: draft.keyboard } : {}),
  };
}
