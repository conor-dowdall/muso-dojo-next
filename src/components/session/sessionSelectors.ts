import { type AppStore } from "@/stores/appStore";
import {
  isDronePartModule,
  isExerciseLooperPartModule,
  isInstrumentPartModule,
  isRhythmPartModule,
} from "@/utils/session/partModuleTypes";

export function selectPart(state: AppStore, sessionId: string, partId: string) {
  return state.sessions[sessionId]?.parts.find((part) => part.id === partId);
}

export function selectPartModule(
  state: AppStore,
  sessionId: string,
  partId: string,
  moduleId: string,
) {
  return selectPart(state, sessionId, partId)?.modules.find(
    (candidateModule) => candidateModule.id === moduleId,
  );
}

export function selectInstrumentForModule(
  state: AppStore,
  sessionId: string,
  partId: string,
  moduleId: string,
) {
  const partModule = selectPartModule(state, sessionId, partId, moduleId);

  return isInstrumentPartModule(partModule) ? partModule.instrument : undefined;
}

export function selectDronePartModule(
  state: AppStore,
  sessionId: string,
  partId: string,
  moduleId: string,
) {
  const partModule = selectPartModule(state, sessionId, partId, moduleId);

  return isDronePartModule(partModule) ? partModule : undefined;
}

export function selectExerciseLooperPartModule(
  state: AppStore,
  sessionId: string,
  partId: string,
  moduleId: string,
) {
  const partModule = selectPartModule(state, sessionId, partId, moduleId);

  return isExerciseLooperPartModule(partModule) ? partModule : undefined;
}

export function selectRhythmPartModule(
  state: AppStore,
  sessionId: string,
  partId: string,
  moduleId: string,
) {
  const partModule = selectPartModule(state, sessionId, partId, moduleId);

  return isRhythmPartModule(partModule) ? partModule : undefined;
}
