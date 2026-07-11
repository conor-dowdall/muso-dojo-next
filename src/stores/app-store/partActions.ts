import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";
import { cloneMusicPartConfig } from "./cloneConfig";
import { resolveSettingValue } from "./settingValue";
import {
  appendPart,
  appendSessionParts,
  findPartById,
  insertPartAfter,
  removePartById,
  replaceSessionParts,
  updatePartById,
  updateSessionById,
} from "./sessionGraph";
import {
  clearActiveNotesAffectedByPartTheory,
  normalizeSessionForWrite,
} from "./writeNormalization";
import { type AppStoreGet, type AppStoreSet, type PartActions } from "./types";
import { normalizePartLengthBeats } from "@/utils/music-part/partLength";
import { setPartBandSource as applyPartBandSource } from "@/utils/music-part/partBand";

function resolveTargetSessionId(
  get: AppStoreGet,
  sessionId: string | undefined,
) {
  const state = get();
  const targetSessionId = sessionId ?? state.activeSessionId;

  return targetSessionId && state.sessions[targetSessionId]
    ? targetSessionId
    : undefined;
}

export function createPartActions(
  set: AppStoreSet,
  get: AppStoreGet,
): PartActions {
  return {
    addPart: (sessionId, settings) => {
      const targetSessionId = resolveTargetSessionId(get, sessionId);
      if (!targetSessionId) {
        return undefined;
      }

      const part = createDefaultMusicPartConfig(settings);

      set((currentState) =>
        updateSessionById(currentState, targetSessionId, (currentSession) =>
          appendPart(currentSession, part),
        ),
      );

      return part.id;
    },
    addParts: (sessionId, parts) => {
      if (parts.length === 0) {
        return [];
      }

      const targetSessionId = resolveTargetSessionId(get, sessionId);
      if (!targetSessionId) {
        return [];
      }

      let addedPartIds: string[] = [];

      set((currentState) =>
        updateSessionById(currentState, targetSessionId, (currentSession) => {
          const previousPartCount = currentSession.parts.length;
          const nextSession = normalizeSessionForWrite(
            appendSessionParts(currentSession, parts),
          );
          addedPartIds = nextSession.parts
            .slice(previousPartCount)
            .map((part) => part.id);

          return nextSession;
        }),
      );

      return addedPartIds;
    },
    replaceParts: (sessionId, parts) => {
      const targetSessionId = resolveTargetSessionId(get, sessionId);
      if (!targetSessionId) {
        return [];
      }

      let replacementPartIds: string[] = [];

      set((currentState) =>
        updateSessionById(currentState, targetSessionId, (currentSession) => {
          const nextSession = normalizeSessionForWrite(
            replaceSessionParts(currentSession, parts),
          );
          replacementPartIds = nextSession.parts.map((part) => part.id);

          return nextSession;
        }),
      );

      return replacementPartIds;
    },
    updatePartSettings: (sessionId, partId, patch) => {
      const shouldClearActiveNotes =
        patch.rootNote !== undefined || patch.noteCollectionKey !== undefined;

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) => {
            const patchedPart = {
              ...part,
              ...patch,
            };

            return shouldClearActiveNotes
              ? clearActiveNotesAffectedByPartTheory(patchedPart)
              : patchedPart;
          }),
        ),
      );
    },
    clonePart: (sessionId, partId) => {
      const session = get().sessions[sessionId];
      const part = findPartById(session, partId);

      if (!session || !part) {
        return undefined;
      }

      const clonedPart = cloneMusicPartConfig(
        part,
        session.parts.map((candidatePart) => candidatePart.id),
      );

      set((state) =>
        updateSessionById(state, sessionId, (currentSession) =>
          insertPartAfter(currentSession, partId, clonedPart),
        ),
      );

      return clonedPart.id;
    },
    removePart: (sessionId, partId) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          removePartById(session, partId),
        ),
      );
    },
    setPartRootNote: (sessionId, partId, rootNote) => {
      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return;
      }

      const nextRootNote = resolveSettingValue(rootNote, part.rootNote);

      if (nextRootNote === part.rootNote) {
        return;
      }

      get().updatePartSettings(sessionId, partId, {
        rootNote: nextRootNote,
      });
    },
    setPartNoteCollectionKey: (sessionId, partId, noteCollectionKey) => {
      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return;
      }

      const nextNoteCollectionKey = resolveSettingValue(
        noteCollectionKey,
        part.noteCollectionKey,
      );

      if (nextNoteCollectionKey === part.noteCollectionKey) {
        return;
      }

      get().updatePartSettings(sessionId, partId, {
        noteCollectionKey: nextNoteCollectionKey,
      });
    },
    setPartAutomaticRhythmBeats: (sessionId, partId, beats) => {
      const normalizedBeats = normalizePartLengthBeats(beats);
      const part = findPartById(get().sessions[sessionId], partId);

      if (normalizedBeats === undefined || !part) {
        return;
      }

      get().updatePartSettings(sessionId, partId, {
        automaticRhythm: {
          beats: normalizedBeats,
          style: part.automaticRhythm?.style ?? "standard",
        },
      });
    },
    setPartBandSource: (sessionId, partId, role, source) => {
      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return;
      }

      const nextPart = applyPartBandSource(part, role, source);
      get().updatePartSettings(sessionId, partId, {
        band: nextPart.band,
      });
    },
  };
}
