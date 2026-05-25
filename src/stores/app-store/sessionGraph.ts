import {
  areActiveNotesEqual,
  areOptionalActiveNotesEqual,
} from "@/utils/instrument/areActiveNotesEqual";
import { normalizeActiveNotes } from "@/utils/instrument/createActiveNotesConfig";
import { type ActiveNotes } from "@/types/instrument-active-note";
import {
  type AppStoreSnapshot,
  type InstrumentInstanceConfig,
  type MusicPartConfig,
  type PartModuleConfig,
  type SessionConfig,
} from "@/types/session";
import {
  normalizeMusicPartForWrite,
  normalizePartModuleForWrite,
  normalizeSessionForWrite,
} from "./writeNormalization";
import { isInstrumentPartModule } from "@/utils/session/partModuleTypes";

function findPartIndex(session: SessionConfig, partId: string) {
  return session.parts.findIndex((part) => part.id === partId);
}

function findPartModuleIndex(part: MusicPartConfig, moduleId: string) {
  return part.modules.findIndex((module) => module.id === moduleId);
}

export function findPartById(
  session: SessionConfig | undefined,
  partId: string,
) {
  return session?.parts.find((part) => part.id === partId);
}

export function findPartModuleById(
  session: SessionConfig | undefined,
  partId: string,
  moduleId: string,
) {
  return findPartById(session, partId)?.modules.find(
    (module) => module.id === moduleId,
  );
}

export function appendPart(
  session: SessionConfig,
  part: MusicPartConfig,
): SessionConfig {
  return appendSessionParts(session, [part]);
}

export function appendSessionParts(
  session: SessionConfig,
  parts: MusicPartConfig[],
): SessionConfig {
  return {
    ...session,
    parts: [...session.parts, ...parts.map(normalizeMusicPartForWrite)],
  };
}

export function replaceSessionParts(
  session: SessionConfig,
  parts: MusicPartConfig[],
): SessionConfig {
  return {
    ...session,
    parts: parts.map(normalizeMusicPartForWrite),
  };
}

export function insertPartAfter(
  session: SessionConfig,
  targetPartId: string,
  part: MusicPartConfig,
): SessionConfig | undefined {
  const partIndex = findPartIndex(session, targetPartId);

  if (partIndex === -1) {
    return undefined;
  }

  const parts = [...session.parts];
  parts.splice(partIndex + 1, 0, normalizeMusicPartForWrite(part));

  return {
    ...session,
    parts,
  };
}

export function removePartById(
  session: SessionConfig,
  partId: string,
): SessionConfig | undefined {
  const parts = session.parts.filter((part) => part.id !== partId);

  if (parts.length === session.parts.length) {
    return undefined;
  }

  return {
    ...session,
    parts,
  };
}

export function updateSessionById(
  state: AppStoreSnapshot,
  sessionId: string,
  updater: (session: SessionConfig) => SessionConfig | undefined,
): AppStoreSnapshot | Pick<AppStoreSnapshot, "sessions"> {
  const session = state.sessions[sessionId];

  if (!session) {
    return state;
  }

  const updatedSession = updater(session);

  if (!updatedSession) {
    return state;
  }

  const nextSession = normalizeSessionForWrite(updatedSession);

  return {
    sessions: {
      ...state.sessions,
      [nextSession.id]: nextSession,
    },
  };
}

export function updatePartById(
  session: SessionConfig,
  partId: string,
  updater: (part: MusicPartConfig) => MusicPartConfig | undefined,
) {
  const partIndex = findPartIndex(session, partId);

  if (partIndex === -1) {
    return undefined;
  }

  const updatedPart = updater(session.parts[partIndex]);

  if (!updatedPart) {
    return undefined;
  }

  const parts = [...session.parts];
  parts[partIndex] = normalizeMusicPartForWrite(updatedPart);

  return {
    ...session,
    parts,
  };
}

export function updatePartModuleById(
  part: MusicPartConfig,
  moduleId: string,
  updater: (partModule: PartModuleConfig) => PartModuleConfig | undefined,
) {
  const moduleIndex = findPartModuleIndex(part, moduleId);

  if (moduleIndex === -1) {
    return undefined;
  }

  const updatedModule = updater(part.modules[moduleIndex]);

  if (!updatedModule) {
    return undefined;
  }

  const modules = [...part.modules];
  modules[moduleIndex] = normalizePartModuleForWrite(updatedModule);

  return {
    ...part,
    modules,
  };
}

export function appendPartModule(
  part: MusicPartConfig,
  partModule: PartModuleConfig,
): MusicPartConfig {
  return {
    ...part,
    modules: [...part.modules, normalizePartModuleForWrite(partModule)],
  };
}

export function insertPartModuleAfter(
  part: MusicPartConfig,
  targetModuleId: string,
  partModule: PartModuleConfig,
): MusicPartConfig | undefined {
  const moduleIndex = findPartModuleIndex(part, targetModuleId);

  if (moduleIndex === -1) {
    return undefined;
  }

  const modules = [...part.modules];
  modules.splice(moduleIndex + 1, 0, normalizePartModuleForWrite(partModule));

  return {
    ...part,
    modules,
  };
}

export function removePartModuleById(
  part: MusicPartConfig,
  moduleId: string,
): MusicPartConfig | undefined {
  const modules = part.modules.filter(
    (partModule) => partModule.id !== moduleId,
  );

  if (modules.length === part.modules.length) {
    return undefined;
  }

  return {
    ...part,
    modules,
  };
}

export function updateInstrumentByModuleId(
  part: MusicPartConfig,
  moduleId: string,
  updater: (
    instrument: InstrumentInstanceConfig,
  ) => InstrumentInstanceConfig | undefined,
) {
  const moduleIndex = findPartModuleIndex(part, moduleId);

  if (moduleIndex === -1) {
    return undefined;
  }

  const partModule = part.modules[moduleIndex];

  if (!isInstrumentPartModule(partModule)) {
    return undefined;
  }

  const updatedInstrument = updater(partModule.instrument);

  if (updatedInstrument === undefined) {
    return undefined;
  }

  const modules = [...part.modules];
  modules[moduleIndex] = normalizePartModuleForWrite({
    ...partModule,
    instrument: updatedInstrument,
  });

  return {
    ...part,
    modules,
  };
}

export function findInstrumentByModuleId(
  session: SessionConfig | undefined,
  partId: string,
  moduleId: string,
) {
  const partModule = findPartModuleById(session, partId, moduleId);

  return isInstrumentPartModule(partModule) ? partModule.instrument : undefined;
}

function normalizeActiveNotesForTrustedWrite(
  activeNotes: ActiveNotes | undefined,
) {
  if (activeNotes === undefined) {
    return undefined;
  }

  const normalizedActiveNotes = normalizeActiveNotes(activeNotes);

  if (normalizedActiveNotes === undefined) {
    return undefined;
  }

  return areActiveNotesEqual(activeNotes, normalizedActiveNotes)
    ? activeNotes
    : normalizedActiveNotes;
}

export function updateInstrumentActiveNotesByModuleId(
  state: AppStoreSnapshot,
  sessionId: string,
  partId: string,
  moduleId: string,
  activeNotes: ActiveNotes | undefined,
): AppStoreSnapshot | Pick<AppStoreSnapshot, "sessions"> {
  const session = state.sessions[sessionId];

  if (!session) {
    return state;
  }

  const partIndex = findPartIndex(session, partId);

  if (partIndex === -1) {
    return state;
  }

  const part = session.parts[partIndex];
  const moduleIndex = findPartModuleIndex(part, moduleId);

  if (moduleIndex === -1) {
    return state;
  }

  const partModule = part.modules[moduleIndex];

  if (!isInstrumentPartModule(partModule)) {
    return state;
  }

  const instrument = partModule.instrument;
  const normalizedActiveNotes =
    normalizeActiveNotesForTrustedWrite(activeNotes);

  if (
    areOptionalActiveNotesEqual(instrument.activeNotes, normalizedActiveNotes)
  ) {
    return state;
  }

  const nextInstrument = { ...instrument };

  if (normalizedActiveNotes === undefined) {
    delete nextInstrument.activeNotes;
  } else {
    nextInstrument.activeNotes = normalizedActiveNotes;
  }

  const nextModules = [...part.modules];
  nextModules[moduleIndex] = {
    ...partModule,
    instrument: nextInstrument,
  };

  const nextParts = [...session.parts];
  nextParts[partIndex] = {
    ...part,
    modules: nextModules,
  };

  return {
    sessions: {
      ...state.sessions,
      [session.id]: {
        ...session,
        lastModified: new Date().toISOString(),
        parts: nextParts,
      },
    },
  };
}
