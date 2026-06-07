import { createDojoSettingsActions } from "./dojoSettingsActions";
import { createDroneActions } from "./droneActions";
import { createExerciseLooperActions } from "./exerciseLooperActions";
import { createInstrumentActions } from "./instrumentActions";
import { createPartActions } from "./partActions";
import { createPartModuleActions } from "./partModuleActions";
import { createSessionActions } from "./sessionActions";
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
    ...createDojoSettingsActions(set),
    ...createSessionActions(set, get),
    ...createPartActions(set, get),
    ...createPartModuleActions(set, get),
    ...createDroneActions(set, get),
    ...createExerciseLooperActions(set, get),
    ...createInstrumentActions(set, get),
  };
}
