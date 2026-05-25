import { resolveSettingValue } from "./settingValue";
import {
  findInstrumentByModuleId,
  updateInstrumentActiveNotesByModuleId,
  updateInstrumentByModuleId,
  updatePartById,
  updateSessionById,
} from "./sessionGraph";
import {
  clearInstrumentActiveNotes,
  normalizeInstrumentForWrite,
} from "./writeNormalization";
import {
  type AppStoreGet,
  type AppStoreSet,
  type InstrumentActions,
} from "./types";
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
                  ? clearInstrumentActiveNotes(patchedInstrument)
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
    setInstrumentActiveNotesLocked: (
      sessionId,
      partId,
      moduleId,
      activeNotesLocked,
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
      const nextActiveNotesLocked = resolveSettingValue(
        activeNotesLocked,
        currentActiveNotesLocked,
      );

      if (nextActiveNotesLocked === currentActiveNotesLocked) {
        return;
      }

      get().updateInstrumentSettings(sessionId, partId, moduleId, {
        activeNotesLocked: nextActiveNotesLocked,
      });
    },
  };
}
