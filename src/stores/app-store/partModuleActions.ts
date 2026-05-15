import { createDefaultPartModuleConfig } from "@/utils/session/createSessionEntities";
import { clonePartModuleConfig } from "./cloneConfig";
import {
  appendPartModule,
  findPartById,
  findPartModuleById,
  insertPartModuleAfter,
  removePartModuleById,
  updatePartById,
  updateSessionById,
} from "./sessionGraph";
import {
  type AppStoreGet,
  type AppStoreSet,
  type PartModuleActions,
} from "./types";

export function createPartModuleActions(
  set: AppStoreSet,
  get: AppStoreGet,
): PartModuleActions {
  return {
    addPartModule: (sessionId, partId, type, settings) => {
      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return undefined;
      }

      const partModule = createDefaultPartModuleConfig(type, settings);

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            appendPartModule(part, partModule),
          ),
        ),
      );

      return partModule.id;
    },
    clonePartModule: (sessionId, partId, moduleId) => {
      const session = get().sessions[sessionId];
      const part = findPartById(session, partId);
      const partModule = findPartModuleById(session, partId, moduleId);

      if (!part || !partModule) {
        return undefined;
      }

      const clonedModule = clonePartModuleConfig(
        partModule,
        part.modules.map((candidateModule) => candidateModule.id),
      );

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            insertPartModuleAfter(part, moduleId, clonedModule),
          ),
        ),
      );

      return clonedModule.id;
    },
    removePartModule: (sessionId, partId, moduleId) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            removePartModuleById(part, moduleId),
          ),
        ),
      );
    },
  };
}
