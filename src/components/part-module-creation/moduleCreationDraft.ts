import {
  type DroneModuleCreationDefault,
  type ExerciseLooperModuleCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationContext,
  type ModuleCreationKind,
  type RememberModuleCreationRequest,
  type RhythmModuleCreationDefault,
} from "@/types/instrument-creation-defaults";
import { type PartModuleCreationRequest } from "@/types/session";

export interface ModuleCreationListDraft {
  drone?: DroneModuleCreationDefault;
  exerciseLooper?: ExerciseLooperModuleCreationDefault;
  fretboard?: FretboardModuleCreationDefault;
  keyboard?: KeyboardModuleCreationDefault;
  moduleKinds: ModuleCreationKind[];
  moduleRequests: PartModuleCreationRequest[];
  rhythm?: RhythmModuleCreationDefault;
}

export function createRememberModuleCreationRequest(
  draft: ModuleCreationListDraft,
  context: ModuleCreationContext,
): RememberModuleCreationRequest {
  return {
    context,
    moduleKinds: [...draft.moduleKinds],
    ...(draft.drone ? { drone: draft.drone } : {}),
    ...(draft.exerciseLooper ? { exerciseLooper: draft.exerciseLooper } : {}),
    ...(draft.fretboard ? { fretboard: draft.fretboard } : {}),
    ...(draft.keyboard ? { keyboard: draft.keyboard } : {}),
    ...(draft.rhythm ? { rhythm: draft.rhythm } : {}),
  };
}
