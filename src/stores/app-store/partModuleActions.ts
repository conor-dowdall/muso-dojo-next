import { createDefaultPartModuleConfigs } from "@/utils/session/createSessionEntities";
import { clonePartModuleConfig } from "./cloneConfig";
import {
  appendPartModules,
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
import { type MusicPartConfig, type PartModuleConfig } from "@/types/session";
import {
  getPartBandModules,
  getPartBandSource,
  reconcilePartBandAfterModuleRemoval,
  setPartBandSource,
} from "@/utils/music-part/partBand";

function assignFirstNewBandSources(
  part: MusicPartConfig,
  modules: PartModuleConfig[],
) {
  let nextPart = appendPartModules(part, modules);

  (["backingNotes", "rhythm"] as const).forEach((role) => {
    const firstNewModule = getPartBandModules(modules, role)[0];
    const hadRoleModule = getPartBandModules(part.modules, role).length > 0;

    if (
      firstNewModule &&
      !hadRoleModule &&
      getPartBandSource(part, role).mode === "session"
    ) {
      nextPart = setPartBandSource(nextPart, role, {
        mode: "module",
        moduleId: firstNewModule.id,
      });
    }
  });

  return nextPart;
}

export function createPartModuleActions(
  set: AppStoreSet,
  get: AppStoreGet,
): PartModuleActions {
  return {
    addPartModule: (sessionId, partId, request) => {
      return get().addPartModules(sessionId, partId, [request])[0];
    },
    addPartModules: (sessionId, partId, requests) => {
      if (requests.length === 0) {
        return [];
      }

      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return [];
      }

      const partModules = createDefaultPartModuleConfigs(requests);

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) => {
            return assignFirstNewBandSources(part, partModules);
          }),
        ),
      );

      return partModules.map((partModule) => partModule.id);
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
            removePartModuleById(
              reconcilePartBandAfterModuleRemoval(part, moduleId),
              moduleId,
            ),
          ),
        ),
      );
    },
  };
}
