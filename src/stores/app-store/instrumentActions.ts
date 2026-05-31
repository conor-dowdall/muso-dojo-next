import { resolveSettingValue } from "./settingValue";
import {
  findInstrumentByModuleId,
  updateInstrumentActiveNotesByModuleId,
  updateInstrumentByModuleId,
  updatePartById,
  updateSessionById,
} from "./sessionGraph";
import {
  clearInstrumentActiveNotesLock,
  normalizeInstrumentForWrite,
} from "./writeNormalization";
import {
  type AppStoreGet,
  type AppStoreSet,
  type InstrumentActions,
} from "./types";
import { areOptionalActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";
import { createInstrumentLayoutConfig } from "@/utils/instrument/createInstrumentLayoutConfig";
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";

export function createInstrumentActions(
  set: AppStoreSet,
  get: AppStoreGet,
): InstrumentActions {
  return {
    updateInstrumentSettings: (sessionId, partId, moduleId, patch) => {
      const shouldClearActiveNotes =
        patch.range !== undefined || patch.config !== undefined;

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updateInstrumentByModuleId(part, moduleId, (instrument) => {
              const patchedInstrument = {
                ...instrument,
                ...patch,
              };

              return normalizeInstrumentForWrite(
                shouldClearActiveNotes
                  ? clearInstrumentActiveNotesLock(patchedInstrument)
                  : patchedInstrument,
              );
            }),
          ),
        ),
      );
    },
    setInstrumentDisplayFormatId: (
      sessionId,
      partId,
      moduleId,
      displayFormatId,
    ) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const currentDisplayFormatId = instrument.displayFormatId ?? "note-names";
      const nextDisplayFormatId = resolveSettingValue(
        displayFormatId,
        currentDisplayFormatId,
      );

      if (nextDisplayFormatId === currentDisplayFormatId) {
        return;
      }

      get().updateInstrumentSettings(sessionId, partId, moduleId, {
        displayFormatId: nextDisplayFormatId,
      });
    },
    setInstrumentNoteEmphasis: (sessionId, partId, moduleId, noteEmphasis) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const currentNoteEmphasis = instrument.noteEmphasis ?? "large";
      const nextNoteEmphasis = resolveSettingValue(
        noteEmphasis,
        currentNoteEmphasis,
      );

      if (nextNoteEmphasis === currentNoteEmphasis) {
        return;
      }

      get().updateInstrumentSettings(sessionId, partId, moduleId, {
        noteEmphasis: nextNoteEmphasis,
      });
    },
    setInstrumentAudioPresetId: (
      sessionId,
      partId,
      moduleId,
      audioPresetId,
    ) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const currentAudioPresetId = resolveInstrumentAudioPresetId(
        instrument.type,
        instrument.audioPresetId,
      );
      const nextAudioPresetId = resolveInstrumentAudioPresetId(
        instrument.type,
        resolveSettingValue(audioPresetId, currentAudioPresetId),
      );

      if (nextAudioPresetId === currentAudioPresetId) {
        return;
      }

      get().updateInstrumentSettings(sessionId, partId, moduleId, {
        audioPresetId: nextAudioPresetId,
      });
    },
    setInstrumentDisplaySize: (sessionId, partId, moduleId, size) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const currentSize = createInstrumentLayoutConfig(instrument.layout).size;
      const nextSize = resolveSettingValue(size, currentSize);

      if (nextSize === currentSize) {
        return;
      }

      get().updateInstrumentSettings(sessionId, partId, moduleId, {
        layout: {
          ...instrument.layout,
          size: nextSize,
        },
      });
    },
    setInstrumentActiveNotes: (sessionId, partId, moduleId, activeNotes) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const nextActiveNotes = resolveSettingValue(
        activeNotes,
        instrument.activeNotes,
      );

      set((state) =>
        updateInstrumentActiveNotesByModuleId(
          state,
          sessionId,
          partId,
          moduleId,
          nextActiveNotes,
        ),
      );
    },
    setInstrumentActiveNotesLock: (
      sessionId,
      partId,
      moduleId,
      activeNotesLocked,
      activeNotesLockSnapshot,
      activeNotesSourceKey,
    ) => {
      const instrument = findInstrumentByModuleId(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!instrument) {
        return;
      }

      const currentActiveNotesLocked = instrument.activeNotesLocked === true;
      const isSameLockRequest =
        activeNotesLockSnapshot !== undefined &&
        areOptionalActiveNotesEqual(
          instrument.activeNotes,
          activeNotesLockSnapshot.activeNotes,
        ) &&
        instrument.activeNotesLockSourceKey ===
          activeNotesLockSnapshot.sourceKey;

      if (activeNotesLocked && activeNotesLockSnapshot === undefined) {
        return;
      }

      if (
        activeNotesLocked === currentActiveNotesLocked &&
        (!activeNotesLocked || isSameLockRequest)
      ) {
        return;
      }

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updateInstrumentByModuleId(part, moduleId, (instrument) => {
              if (activeNotesLocked) {
                const snapshot = activeNotesLockSnapshot;
                if (!snapshot) {
                  return undefined;
                }

                return normalizeInstrumentForWrite({
                  ...instrument,
                  activeNotes: snapshot.activeNotes,
                  activeNotesLocked: true,
                  activeNotesLockSourceKey: snapshot.sourceKey,
                });
              }

              if (
                instrument.activeNotesLockSourceKey &&
                activeNotesSourceKey &&
                instrument.activeNotesLockSourceKey !== activeNotesSourceKey
              ) {
                return normalizeInstrumentForWrite(
                  clearInstrumentActiveNotesLock(instrument),
                );
              }

              return normalizeInstrumentForWrite({
                ...instrument,
                activeNotesLocked: false,
              });
            }),
          ),
        ),
      );
    },
  };
}
