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
  type FretboardInstrumentSettingsPatch,
  type InstrumentActions,
  type KeyboardInstrumentSettingsPatch,
} from "./types";
import {
  type InstrumentInstanceBaseConfig,
  type InstrumentInstanceConfig,
  type InstrumentType,
} from "@/types/session";
import { areOptionalActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";
import { createInstrumentLayoutConfig } from "@/utils/instrument/createInstrumentLayoutConfig";
import {
  resolveInstrumentAudioPresetId,
  type InstrumentAudioPresetContext,
} from "@/utils/instrument/resolveInstrumentAudioPreset";

function getInstrumentAudioPresetContext(
  instrument: InstrumentInstanceConfig,
): InstrumentAudioPresetContext | undefined {
  if (instrument.type !== "fretboard") {
    return undefined;
  }

  return {
    fretboardInstrument: instrument.config?.instrument,
  };
}

export function createInstrumentActions(
  set: AppStoreSet,
  get: AppStoreGet,
): InstrumentActions {
  type InstrumentSettingsPatch =
    | FretboardInstrumentSettingsPatch
    | KeyboardInstrumentSettingsPatch
    | Partial<InstrumentInstanceBaseConfig>;

  const updateInstrumentSettings = (
    sessionId: string,
    partId: string,
    moduleId: string,
    expectedType: InstrumentType | undefined,
    patch: InstrumentSettingsPatch,
  ) => {
    const shouldClearActiveNotes =
      ("range" in patch && patch.range !== undefined) ||
      ("config" in patch && patch.config !== undefined);

    set((state) =>
      updateSessionById(state, sessionId, (session) =>
        updatePartById(session, partId, (part) =>
          updateInstrumentByModuleId(part, moduleId, (instrument) => {
            if (expectedType && instrument.type !== expectedType) {
              return undefined;
            }

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
  };

  return {
    updateFretboardInstrumentSettings: (sessionId, partId, moduleId, patch) =>
      updateInstrumentSettings(sessionId, partId, moduleId, "fretboard", patch),
    updateKeyboardInstrumentSettings: (sessionId, partId, moduleId, patch) =>
      updateInstrumentSettings(sessionId, partId, moduleId, "keyboard", patch),
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

      updateInstrumentSettings(sessionId, partId, moduleId, undefined, {
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

      updateInstrumentSettings(sessionId, partId, moduleId, undefined, {
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

      const audioPresetContext = getInstrumentAudioPresetContext(instrument);
      const currentAudioPresetId = resolveInstrumentAudioPresetId(
        instrument.type,
        instrument.audioPresetId,
        audioPresetContext,
      );
      const nextAudioPresetId = resolveInstrumentAudioPresetId(
        instrument.type,
        resolveSettingValue(audioPresetId, currentAudioPresetId),
        audioPresetContext,
      );

      if (nextAudioPresetId === currentAudioPresetId) {
        return;
      }

      updateInstrumentSettings(sessionId, partId, moduleId, undefined, {
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

      updateInstrumentSettings(sessionId, partId, moduleId, undefined, {
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
