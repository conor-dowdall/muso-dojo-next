import { createDojoSettingsActions } from "./dojoSettingsActions";
import { createDroneActions } from "./droneActions";
import { createExerciseLooperActions } from "./exerciseLooperActions";
import { createInstrumentActions } from "./instrumentActions";
import { createPartActions } from "./partActions";
import { createPartModuleActions } from "./partModuleActions";
import { createRhythmActions } from "./rhythmActions";
import { createSessionActions } from "./sessionActions";
import { createWorkspaceActions } from "./workspaceActions";
import {
  type AppStoreActions,
  type AppStoreGet,
  type AppStoreSet,
} from "./types";

export function createAppStoreActions(
  set: AppStoreSet,
  get: AppStoreGet,
): AppStoreActions {
  return {
    ...createWorkspaceActions(set),
    ...createDojoSettingsActions(set),
    ...createSessionActions(set, get),
    ...createPartActions(set, get),
    ...createPartModuleActions(set, get),
    ...createDroneActions(set, get),
    ...createExerciseLooperActions(set, get),
    ...createRhythmActions(set, get),
    ...createInstrumentActions(set, get),
  };
}
