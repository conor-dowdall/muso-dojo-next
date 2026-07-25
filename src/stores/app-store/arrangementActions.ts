import {
  MAX_ARRANGEMENT_ENTRY_PLAY_COUNT,
  MIN_ARRANGEMENT_ENTRY_PLAY_COUNT,
  type ArrangementConfig,
  type ArrangementSectionConfig,
} from "@/types/arrangement";
import { type SessionConfig } from "@/types/session";
import { createDefaultArrangementSectionName } from "@/utils/arrangement/arrangementSectionNames";
import { cloneMusicPartGraph } from "@/utils/arrangement/cloneMusicPartGraph";
import { createEntityId } from "@/utils/session/createSessionEntities";
import { normalizeSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import {
  createEntityCopyName,
  createUniqueArrangementName,
  DEFAULT_ARRANGEMENT_NAME,
  normalizeEntityNameForComparison,
} from "./entityIds";
import {
  type AppStoreGet,
  type AppStoreSet,
  type ArrangementActions,
} from "./types";

function now() {
  return new Date().toISOString();
}

function copySerializable<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

function captureSection(
  session: SessionConfig,
  name: string,
  sectionId = createEntityId("section"),
): ArrangementSectionConfig {
  const capturedAt = now();
  return {
    id: sectionId,
    name,
    source: {
      sessionId: session.id,
      sessionName: session.name,
      sessionLastModified: session.lastModified,
      sessionTempoBpm: session.tempoBpm ?? 80,
      capturedAt,
    },
    backingBand: normalizeSessionBackingBandConfig(session.backingBand),
    parts: cloneMusicPartGraph(session.parts),
  };
}

function touchArrangement(
  arrangement: ArrangementConfig,
  patch: Partial<ArrangementConfig>,
): ArrangementConfig {
  return { ...arrangement, ...patch, lastModified: now() };
}

export function createArrangementActions(
  set: AppStoreSet,
  get: AppStoreGet,
): ArrangementActions {
  return {
    addArrangement: (settings) => {
      const state = get();
      const id = createEntityId("arrangement");
      const arrangement: ArrangementConfig = {
        id,
        name: createUniqueArrangementName(
          settings?.name ?? DEFAULT_ARRANGEMENT_NAME,
          Object.values(state.arrangements).map(({ name }) => name),
        ),
        lastModified: now(),
        tempoBpm: 80,
        playbackMode: "once",
        sections: [],
        entries: [],
      };
      set((current) => ({
        activeWorkspace: { kind: "arrangement", id },
        activeSessionId: null,
        arrangements: { ...current.arrangements, [id]: arrangement },
      }));
      return id;
    },
    cloneArrangement: (arrangementId) => {
      const state = get();
      const source = state.arrangements[arrangementId];
      if (!source) return undefined;

      const id = createEntityId("arrangement");
      const sectionIds = new Map(
        source.sections.map((section) => [
          section.id,
          createEntityId("section"),
        ]),
      );
      const arrangement: ArrangementConfig = {
        ...copySerializable(source),
        id,
        name: createUniqueArrangementName(
          createEntityCopyName(source.name),
          Object.values(state.arrangements).map(({ name }) => name),
        ),
        lastModified: now(),
        sections: source.sections.map((section) => ({
          ...copySerializable(section),
          id: sectionIds.get(section.id)!,
          parts: cloneMusicPartGraph(section.parts),
        })),
        entries: source.entries.map((entry) => ({
          ...entry,
          id: createEntityId("entry"),
          sectionId: sectionIds.get(entry.sectionId)!,
        })),
      };
      set((current) => ({
        activeWorkspace: { kind: "arrangement", id },
        activeSessionId: null,
        arrangements: { ...current.arrangements, [id]: arrangement },
      }));
      return id;
    },
    removeArrangement: (arrangementId) => {
      if (!get().arrangements[arrangementId]) return;
      set((state) => {
        const arrangements = { ...state.arrangements };
        delete arrangements[arrangementId];
        if (
          state.activeWorkspace?.kind !== "arrangement" ||
          state.activeWorkspace.id !== arrangementId
        ) {
          return { arrangements };
        }
        const sessionId = Object.keys(state.sessions)[0];
        const nextArrangementId = Object.keys(arrangements)[0];
        const activeWorkspace = sessionId
          ? ({ kind: "session", id: sessionId } as const)
          : nextArrangementId
            ? ({ kind: "arrangement", id: nextArrangementId } as const)
            : null;
        return {
          activeWorkspace,
          activeSessionId:
            activeWorkspace?.kind === "session" ? sessionId! : null,
          arrangements,
        };
      });
    },
    renameArrangement: (arrangementId, name) => {
      const trimmed = name.trim();
      const state = get();
      const arrangement = state.arrangements[arrangementId];
      if (
        !arrangement ||
        !trimmed ||
        trimmed === arrangement.name ||
        Object.values(state.arrangements).some(
          (candidate) =>
            candidate.id !== arrangementId &&
            normalizeEntityNameForComparison(candidate.name) ===
              normalizeEntityNameForComparison(trimmed),
        )
      ) {
        return;
      }
      set((current) => ({
        arrangements: {
          ...current.arrangements,
          [arrangementId]: touchArrangement(arrangement, { name: trimmed }),
        },
      }));
    },
    setArrangementTempoBpm: (arrangementId, tempoBpm) => {
      const arrangement = get().arrangements[arrangementId];
      if (
        !arrangement ||
        !Number.isInteger(tempoBpm) ||
        tempoBpm < 30 ||
        tempoBpm > 300 ||
        arrangement.tempoBpm === tempoBpm
      )
        return;
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, { tempoBpm }),
        },
      }));
    },
    setArrangementPlaybackMode: (arrangementId, playbackMode) => {
      const arrangement = get().arrangements[arrangementId];
      if (
        !arrangement ||
        (playbackMode !== "once" && playbackMode !== "loop") ||
        arrangement.playbackMode === playbackMode
      )
        return;
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, { playbackMode }),
        },
      }));
    },
    addArrangementSectionFromSession: (arrangementId, sessionId) => {
      const state = get();
      const arrangement = state.arrangements[arrangementId];
      const session = state.sessions[sessionId];
      if (!arrangement || !session || session.parts.length === 0) {
        return undefined;
      }
      const section = captureSection(
        session,
        createDefaultArrangementSectionName(
          arrangement.sections.map(({ name }) => name),
        ),
      );
      const entryId = createEntityId("entry");
      const entry = { id: entryId, sectionId: section.id, playCount: 1 };
      const firstCapture = arrangement.entries.length === 0;
      set((current) => ({
        arrangements: {
          ...current.arrangements,
          [arrangementId]: touchArrangement(arrangement, {
            ...(firstCapture ? { tempoBpm: session.tempoBpm ?? 80 } : {}),
            sections: [...arrangement.sections, section],
            entries: [...arrangement.entries, entry],
          }),
        },
      }));
      return { sectionId: section.id, entryId };
    },
    appendArrangementSectionEntry: (arrangementId, sectionId) => {
      const arrangement = get().arrangements[arrangementId];
      if (
        !arrangement ||
        !arrangement.sections.some(({ id }) => id === sectionId)
      )
        return undefined;
      const entryId = createEntityId("entry");
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, {
            entries: [
              ...arrangement.entries,
              { id: entryId, sectionId, playCount: 1 },
            ],
          }),
        },
      }));
      return entryId;
    },
    replaceArrangementSectionFromSession: (
      arrangementId,
      sectionId,
      sessionId,
    ) => {
      const state = get();
      const arrangement = state.arrangements[arrangementId];
      const session = state.sessions[sessionId];
      const section = arrangement?.sections.find(({ id }) => id === sectionId);
      if (!arrangement || !section || !session || session.parts.length === 0) {
        return false;
      }
      const replacement = captureSection(session, section.name, section.id);
      set((current) => ({
        arrangements: {
          ...current.arrangements,
          [arrangementId]: touchArrangement(arrangement, {
            sections: arrangement.sections.map((candidate) =>
              candidate.id === sectionId ? replacement : candidate,
            ),
          }),
        },
      }));
      return true;
    },
    moveArrangementEntry: (arrangementId, entryId, direction) => {
      const arrangement = get().arrangements[arrangementId];
      if (!arrangement) return;
      const index = arrangement.entries.findIndex(({ id }) => id === entryId);
      const target = direction === "earlier" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= arrangement.entries.length)
        return;
      const entries = [...arrangement.entries];
      [entries[index], entries[target]] = [entries[target]!, entries[index]!];
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, { entries }),
        },
      }));
    },
    cloneArrangementEntry: (arrangementId, entryId) => {
      const arrangement = get().arrangements[arrangementId];
      const index = arrangement?.entries.findIndex(({ id }) => id === entryId);
      if (!arrangement || index === undefined || index < 0) return undefined;
      const id = createEntityId("entry");
      const entries = [...arrangement.entries];
      entries.splice(index + 1, 0, { ...entries[index]!, id });
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, { entries }),
        },
      }));
      return id;
    },
    setArrangementEntryPlayCount: (arrangementId, entryId, playCount) => {
      const arrangement = get().arrangements[arrangementId];
      const entry = arrangement?.entries.find(({ id }) => id === entryId);
      if (
        !arrangement ||
        !entry ||
        !Number.isInteger(playCount) ||
        playCount < MIN_ARRANGEMENT_ENTRY_PLAY_COUNT ||
        playCount > MAX_ARRANGEMENT_ENTRY_PLAY_COUNT ||
        entry.playCount === playCount
      )
        return;
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, {
            entries: arrangement.entries.map((candidate) =>
              candidate.id === entryId
                ? { ...candidate, playCount }
                : candidate,
            ),
          }),
        },
      }));
    },
    removeArrangementEntry: (arrangementId, entryId) => {
      const arrangement = get().arrangements[arrangementId];
      if (!arrangement?.entries.some(({ id }) => id === entryId)) return;
      const entries = arrangement.entries.filter(({ id }) => id !== entryId);
      const sectionIds = new Set(entries.map(({ sectionId }) => sectionId));
      set((state) => ({
        arrangements: {
          ...state.arrangements,
          [arrangementId]: touchArrangement(arrangement, {
            entries,
            sections: arrangement.sections.filter(({ id }) =>
              sectionIds.has(id),
            ),
          }),
        },
      }));
    },
  };
}
