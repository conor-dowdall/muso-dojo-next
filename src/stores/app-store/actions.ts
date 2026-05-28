import { createInstrumentActions } from "./instrumentActions";
import { createPartActions } from "./partActions";
import { createPartModuleActions } from "./partModuleActions";
import { createPreferenceActions } from "./preferenceActions";
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
    ...createSessionActions(set, get),
    ...createPartActions(set, get),
    ...createPartModuleActions(set, get),
    ...createInstrumentActions(set, get),
    ...createPreferenceActions(set),
  };
}
