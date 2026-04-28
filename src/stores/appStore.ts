"use client";

import { useEffect, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import {
  createAppStoreSnapshot,
  normalizeAppStoreSnapshot,
  normalizeInstrumentInstanceConfig,
  normalizeMusicGroupConfig,
  normalizeWorkspaceConfig,
} from "@/utils/workspace/createWorkspaceConfig";
import {
  createDefaultInstrumentConfig,
  createDefaultMusicGroupConfig,
  createDefaultWorkspaceConfig,
  createFallbackWorkspaceConfig,
} from "@/utils/workspace/createWorkspaceEntities";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
  type InstrumentCreationConfig,
  type InstrumentInstanceBaseConfig,
  type InstrumentInstanceConfig,
  type InstrumentType,
  type KeyboardInstrumentInstanceConfig,
  type MusicGroupConfig,
  type WorkspaceConfig,
} from "@/types/workspace";
import { type SettingValue } from "@/types/state";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type DisplayFormatId } from "@/data/displayFormats";

export type InstrumentSettingsPatch = Partial<
  Omit<InstrumentInstanceBaseConfig, "id">
> & {
  theme?:
    | FretboardInstrumentInstanceConfig["theme"]
    | KeyboardInstrumentInstanceConfig["theme"];
  range?: KeyboardInstrumentInstanceConfig["range"];
  config?:
    | FretboardInstrumentInstanceConfig["config"]
    | KeyboardInstrumentInstanceConfig["config"];
};

type MusicGroupSettingsPatch = Partial<Omit<MusicGroupConfig, "id">>;

interface AppStoreActions {
  setActiveWorkspaceId: (workspaceId: string) => void;
  addWorkspace: (settings?: { name?: string }) => string;
  importWorkspace: (workspace: WorkspaceConfig) => string;
  cloneWorkspace: (workspaceId: string) => string | undefined;
  removeWorkspace: (workspaceId: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  addMusicGroup: (
    workspaceId?: string,
    settings?: {
      rootNote?: string;
      noteCollectionKey?: NoteCollectionKey;
      instrumentType?: InstrumentType;
    },
  ) => string | undefined;
  updateMusicGroupSettings: (
    workspaceId: string,
    groupId: string,
    patch: MusicGroupSettingsPatch,
  ) => void;
  cloneMusicGroup: (workspaceId: string, groupId: string) => string | undefined;
  removeMusicGroup: (workspaceId: string, groupId: string) => void;
  addInstrument: (
    workspaceId: string,
    groupId: string,
    type?: InstrumentType,
    settings?: InstrumentCreationConfig,
  ) => string | undefined;
  updateInstrumentSettings: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
    patch: InstrumentSettingsPatch,
  ) => void;
  cloneInstrument: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
  ) => string | undefined;
  removeInstrument: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
  ) => void;
  setGroupRootNote: (
    workspaceId: string,
    groupId: string,
    rootNote: SettingValue<string>,
  ) => void;
  setGroupNoteCollectionKey: (
    workspaceId: string,
    groupId: string,
    noteCollectionKey: SettingValue<NoteCollectionKey>,
  ) => void;
  setInstrumentDisplayFormatId: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
    displayFormatId: SettingValue<DisplayFormatId>,
  ) => void;
  setInstrumentNoteEmphasis: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
    noteEmphasis: SettingValue<InstrumentNoteEmphasis>,
  ) => void;
  setInstrumentActiveNotes: (
    workspaceId: string,
    groupId: string,
    instrumentId: string,
    activeNotes: SettingValue<ActiveNotes | undefined>,
  ) => void;
}

export type AppStore = AppStoreSnapshot & AppStoreActions;

const initialSnapshot = createAppStoreSnapshot(createFallbackWorkspaceConfig());
const DEFAULT_WORKSPACE_NAME = "Practice Workspace";
let hasRequestedHydration = false;
let hasCompletedHydration = false;

function resolveSettingValue<T>(value: SettingValue<T>, previousValue: T): T {
  return typeof value === "function"
    ? (value as (prev: T) => T)(previousValue)
    : value;
}

function cloneSerializableConfig<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function createCopyId(baseId: string, existingIds: Iterable<string>) {
  const existingIdSet = new Set(existingIds);
  const copyBase = baseId.replace(/-copy(?:-\d+)?$/, "");
  let copyIndex = 1;
  let nextId = `${copyBase}-copy`;

  while (existingIdSet.has(nextId)) {
    copyIndex += 1;
    nextId = `${copyBase}-copy-${copyIndex}`;
  }

  return nextId;
}

function normalizeWorkspaceNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

function createUniqueWorkspaceName(
  preferredName: string | undefined,
  existingNames: Iterable<string>,
) {
  const baseName = preferredName?.trim() || DEFAULT_WORKSPACE_NAME;
  const existingNameSet = new Set(
    Array.from(existingNames, normalizeWorkspaceNameForComparison),
  );
  const baseNameKey = normalizeWorkspaceNameForComparison(baseName);

  if (!existingNameSet.has(baseNameKey)) {
    return baseName;
  }

  let nameIndex = 2;
  let nextName = `${baseName} ${nameIndex}`;

  while (existingNameSet.has(normalizeWorkspaceNameForComparison(nextName))) {
    nameIndex += 1;
    nextName = `${baseName} ${nameIndex}`;
  }

  return nextName;
}

function createWorkspaceCopyName(workspaceName: string) {
  const sourceName = workspaceName.replace(/\s+Copy(?:\s+\d+)?$/i, "");
  return `${sourceName} Copy`;
}

function normalizeWorkspaceForWrite(workspace: WorkspaceConfig) {
  return normalizeWorkspaceConfig({
    ...workspace,
    lastModified: new Date().toISOString(),
  });
}

function clearInstrumentActiveNotes<T extends { activeNotes?: unknown }>(
  instrument: T,
): T {
  const nextInstrument = { ...instrument };
  delete nextInstrument.activeNotes;
  return nextInstrument;
}

function clearActiveNotesAffectedByGroupTheory(
  group: MusicGroupConfig,
): MusicGroupConfig {
  return {
    ...group,
    instruments: group.instruments.map((instrument) => {
      const followsGroupRoot = instrument.rootNote === undefined;
      const followsGroupCollection = instrument.noteCollectionKey === undefined;

      return followsGroupRoot || followsGroupCollection
        ? clearInstrumentActiveNotes(instrument)
        : instrument;
    }),
  };
}

function normalizeInstrumentForWrite(
  instrument: unknown,
): InstrumentInstanceConfig {
  const normalized = normalizeInstrumentInstanceConfig(instrument);

  if (!normalized) {
    throw new Error("Unable to normalize instrument");
  }

  return normalized;
}

function normalizeMusicGroupForWrite(
  group: MusicGroupConfig,
): MusicGroupConfig {
  const normalized = normalizeMusicGroupConfig(group);

  if (!normalized) {
    throw new Error(`Unable to normalize music group "${group.id}"`);
  }

  return normalized;
}

function cloneInstrumentConfig(
  instrument: InstrumentInstanceConfig,
  existingIds: Iterable<string>,
): InstrumentInstanceConfig {
  return normalizeInstrumentForWrite({
    ...cloneSerializableConfig(instrument),
    id: createCopyId(instrument.id, existingIds),
  });
}

function cloneMusicGroupConfig(
  group: MusicGroupConfig,
  existingGroupIds: Iterable<string>,
): MusicGroupConfig {
  const existingInstrumentIds = group.instruments.map(
    (instrument) => instrument.id,
  );
  const clonedInstruments = group.instruments.map((instrument) => {
    const clone = cloneInstrumentConfig(instrument, existingInstrumentIds);
    existingInstrumentIds.push(clone.id);
    return clone;
  });

  return normalizeMusicGroupForWrite({
    ...cloneSerializableConfig(group),
    id: createCopyId(group.id, existingGroupIds),
    instruments: clonedInstruments,
  });
}

function cloneWorkspaceConfig(
  workspace: WorkspaceConfig,
  existingWorkspaceIds: Iterable<string>,
  existingWorkspaceNames: Iterable<string>,
): WorkspaceConfig {
  const existingGroupIds = workspace.groups.map((group) => group.id);
  const clonedGroups = workspace.groups.map((group) => {
    const clone = cloneMusicGroupConfig(group, existingGroupIds);
    existingGroupIds.push(clone.id);
    return clone;
  });

  return normalizeWorkspaceForWrite({
    ...cloneSerializableConfig(workspace),
    id: createCopyId(workspace.id, existingWorkspaceIds),
    name: createUniqueWorkspaceName(
      createWorkspaceCopyName(workspace.name),
      existingWorkspaceNames,
    ),
    groups: clonedGroups,
  });
}

function updateWorkspaceById(
  state: AppStore,
  workspaceId: string,
  updater: (workspace: WorkspaceConfig) => WorkspaceConfig,
): Pick<AppStoreSnapshot, "workspaces"> {
  const workspace = state.workspaces[workspaceId];

  if (!workspace) {
    return { workspaces: state.workspaces };
  }

  const nextWorkspace = normalizeWorkspaceForWrite(updater(workspace));

  return {
    workspaces: {
      ...state.workspaces,
      [nextWorkspace.id]: nextWorkspace,
    },
  };
}

function updateGroupById(
  workspace: WorkspaceConfig,
  groupId: string,
  updater: (group: MusicGroupConfig) => MusicGroupConfig,
) {
  return {
    ...workspace,
    groups: workspace.groups.map((group) =>
      group.id === groupId
        ? normalizeMusicGroupForWrite(updater(group))
        : group,
    ),
  };
}

function updateInstrumentById(
  group: MusicGroupConfig,
  instrumentId: string,
  updater: (instrument: InstrumentInstanceConfig) => unknown,
) {
  return {
    ...group,
    instruments: group.instruments.map((instrument) =>
      instrument.id === instrumentId
        ? normalizeInstrumentForWrite(updater(instrument))
        : instrument,
    ),
  };
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialSnapshot,
        setActiveWorkspaceId: (workspaceId) => {
          set((state) =>
            state.workspaces[workspaceId]
              ? { activeWorkspaceId: workspaceId }
              : {},
          );
        },
        addWorkspace: (settings) => {
          const workspace = createDefaultWorkspaceConfig({
            ...settings,
            name: createUniqueWorkspaceName(
              settings?.name,
              Object.values(get().workspaces).map(
                (workspace) => workspace.name,
              ),
            ),
          });

          set((state) => ({
            activeWorkspaceId: workspace.id,
            workspaces: {
              ...state.workspaces,
              [workspace.id]: workspace,
            },
          }));

          return workspace.id;
        },
        importWorkspace: (workspace) => {
          const importedWorkspace = normalizeWorkspaceForWrite(workspace);

          set((state) => ({
            activeWorkspaceId: importedWorkspace.id,
            workspaces: {
              ...state.workspaces,
              [importedWorkspace.id]: importedWorkspace,
            },
          }));

          return importedWorkspace.id;
        },
        cloneWorkspace: (workspaceId) => {
          const workspace = get().workspaces[workspaceId];

          if (!workspace) {
            return undefined;
          }

          const clonedWorkspace = cloneWorkspaceConfig(
            workspace,
            Object.keys(get().workspaces),
            Object.values(get().workspaces).map((workspace) => workspace.name),
          );

          set((state) => ({
            activeWorkspaceId: clonedWorkspace.id,
            workspaces: {
              ...state.workspaces,
              [clonedWorkspace.id]: clonedWorkspace,
            },
          }));

          return clonedWorkspace.id;
        },
        removeWorkspace: (workspaceId) => {
          set((state) => {
            if (!state.workspaces[workspaceId]) {
              return {};
            }

            const nextWorkspaces = { ...state.workspaces };
            delete nextWorkspaces[workspaceId];
            const replacementWorkspace = Object.values(nextWorkspaces)[0];

            return {
              activeWorkspaceId:
                state.activeWorkspaceId === workspaceId
                  ? (replacementWorkspace?.id ?? null)
                  : state.activeWorkspaceId,
              workspaces: nextWorkspaces,
            };
          });
        },
        renameWorkspace: (workspaceId, name) => {
          const trimmedName = name.trim();
          const workspace = get().workspaces[workspaceId];
          const nameIsTaken = Object.values(get().workspaces).some(
            (candidateWorkspace) =>
              candidateWorkspace.id !== workspaceId &&
              normalizeWorkspaceNameForComparison(candidateWorkspace.name) ===
                normalizeWorkspaceNameForComparison(trimmedName),
          );

          if (
            !trimmedName ||
            !workspace ||
            workspace.name === trimmedName ||
            nameIsTaken
          ) {
            return;
          }

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) => ({
              ...workspace,
              name: trimmedName,
            })),
          );
        },
        addMusicGroup: (workspaceId, settings) => {
          const state = get();
          const targetWorkspaceId = workspaceId ?? state.activeWorkspaceId;
          if (!targetWorkspaceId) {
            return undefined;
          }

          const workspace = state.workspaces[targetWorkspaceId];

          if (!workspace) {
            return undefined;
          }

          const group = createDefaultMusicGroupConfig(settings);

          set((currentState) =>
            updateWorkspaceById(
              currentState,
              targetWorkspaceId,
              (currentWorkspace) => ({
                ...currentWorkspace,
                groups: [...currentWorkspace.groups, group],
              }),
            ),
          );

          return group.id;
        },
        updateMusicGroupSettings: (workspaceId, groupId, patch) => {
          const shouldClearActiveNotes =
            patch.rootNote !== undefined ||
            patch.noteCollectionKey !== undefined;

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) =>
              updateGroupById(workspace, groupId, (group) => {
                const patchedGroup = {
                  ...group,
                  ...patch,
                };

                return shouldClearActiveNotes
                  ? clearActiveNotesAffectedByGroupTheory(patchedGroup)
                  : patchedGroup;
              }),
            ),
          );
        },
        cloneMusicGroup: (workspaceId, groupId) => {
          const workspace = get().workspaces[workspaceId];
          const group = workspace?.groups.find(
            (candidateGroup) => candidateGroup.id === groupId,
          );

          if (!workspace || !group) {
            return undefined;
          }

          const clonedGroup = cloneMusicGroupConfig(
            group,
            workspace.groups.map((candidateGroup) => candidateGroup.id),
          );

          set((state) =>
            updateWorkspaceById(state, workspaceId, (currentWorkspace) => {
              const groupIndex = currentWorkspace.groups.findIndex(
                (candidateGroup) => candidateGroup.id === groupId,
              );
              const nextGroups = [...currentWorkspace.groups];
              nextGroups.splice(groupIndex + 1, 0, clonedGroup);

              return {
                ...currentWorkspace,
                groups: nextGroups,
              };
            }),
          );

          return clonedGroup.id;
        },
        removeMusicGroup: (workspaceId, groupId) => {
          const workspace = get().workspaces[workspaceId];

          if (!workspace?.groups.some((group) => group.id === groupId)) {
            return;
          }

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) => ({
              ...workspace,
              groups: workspace.groups.filter((group) => group.id !== groupId),
            })),
          );
        },
        addInstrument: (workspaceId, groupId, type = "keyboard", settings) => {
          const group = get().workspaces[workspaceId]?.groups.find(
            (candidateGroup) => candidateGroup.id === groupId,
          );

          if (!group) {
            return undefined;
          }

          const instrument = createDefaultInstrumentConfig(type, settings);

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) =>
              updateGroupById(workspace, groupId, (group) => ({
                ...group,
                instruments: [...group.instruments, instrument],
              })),
            ),
          );

          return instrument.id;
        },
        updateInstrumentSettings: (
          workspaceId,
          groupId,
          instrumentId,
          patch,
        ) => {
          const shouldClearActiveNotes =
            patch.rootNote !== undefined ||
            patch.noteCollectionKey !== undefined ||
            patch.range !== undefined ||
            patch.config !== undefined;

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) =>
              updateGroupById(workspace, groupId, (group) =>
                updateInstrumentById(group, instrumentId, (instrument) => {
                  const patchedInstrument = {
                    ...instrument,
                    ...patch,
                  };

                  return shouldClearActiveNotes
                    ? clearInstrumentActiveNotes(patchedInstrument)
                    : patchedInstrument;
                }),
              ),
            ),
          );
        },
        cloneInstrument: (workspaceId, groupId, instrumentId) => {
          const workspace = get().workspaces[workspaceId];
          const group = workspace?.groups.find(
            (candidateGroup) => candidateGroup.id === groupId,
          );
          const instrument = group?.instruments.find(
            (candidateInstrument) => candidateInstrument.id === instrumentId,
          );

          if (!group || !instrument) {
            return undefined;
          }

          const clonedInstrument = cloneInstrumentConfig(
            instrument,
            group.instruments.map(
              (candidateInstrument) => candidateInstrument.id,
            ),
          );

          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) =>
              updateGroupById(workspace, groupId, (currentGroup) => {
                const instrumentIndex = currentGroup.instruments.findIndex(
                  (candidateInstrument) =>
                    candidateInstrument.id === instrumentId,
                );

                if (instrumentIndex === -1) {
                  return currentGroup;
                }

                const nextInstruments = [...currentGroup.instruments];
                nextInstruments.splice(
                  instrumentIndex + 1,
                  0,
                  clonedInstrument,
                );

                return {
                  ...currentGroup,
                  instruments: nextInstruments,
                };
              }),
            ),
          );

          return clonedInstrument.id;
        },
        removeInstrument: (workspaceId, groupId, instrumentId) => {
          set((state) =>
            updateWorkspaceById(state, workspaceId, (workspace) =>
              updateGroupById(workspace, groupId, (group) => ({
                ...group,
                instruments: group.instruments.filter(
                  (instrument) => instrument.id !== instrumentId,
                ),
              })),
            ),
          );
        },
        setGroupRootNote: (workspaceId, groupId, rootNote) => {
          const group = get().workspaces[workspaceId]?.groups.find(
            (candidateGroup) => candidateGroup.id === groupId,
          );

          if (!group) {
            return;
          }

          get().updateMusicGroupSettings(workspaceId, groupId, {
            rootNote: resolveSettingValue(rootNote, group.rootNote),
          });
        },
        setGroupNoteCollectionKey: (
          workspaceId,
          groupId,
          noteCollectionKey,
        ) => {
          const group = get().workspaces[workspaceId]?.groups.find(
            (candidateGroup) => candidateGroup.id === groupId,
          );

          if (!group) {
            return;
          }

          get().updateMusicGroupSettings(workspaceId, groupId, {
            noteCollectionKey: resolveSettingValue(
              noteCollectionKey,
              group.noteCollectionKey,
            ),
          });
        },
        setInstrumentDisplayFormatId: (
          workspaceId,
          groupId,
          instrumentId,
          displayFormatId,
        ) => {
          const instrument = get()
            .workspaces[workspaceId]?.groups.find(
              (group) => group.id === groupId,
            )
            ?.instruments.find(
              (candidateInstrument) => candidateInstrument.id === instrumentId,
            );

          get().updateInstrumentSettings(workspaceId, groupId, instrumentId, {
            displayFormatId: resolveSettingValue(
              displayFormatId,
              instrument?.displayFormatId ?? "note-names",
            ),
          });
        },
        setInstrumentNoteEmphasis: (
          workspaceId,
          groupId,
          instrumentId,
          noteEmphasis,
        ) => {
          const instrument = get()
            .workspaces[workspaceId]?.groups.find(
              (group) => group.id === groupId,
            )
            ?.instruments.find(
              (candidateInstrument) => candidateInstrument.id === instrumentId,
            );

          get().updateInstrumentSettings(workspaceId, groupId, instrumentId, {
            noteEmphasis: resolveSettingValue(
              noteEmphasis,
              instrument?.noteEmphasis ?? "large",
            ),
          });
        },
        setInstrumentActiveNotes: (
          workspaceId,
          groupId,
          instrumentId,
          activeNotes,
        ) => {
          const instrument = get()
            .workspaces[workspaceId]?.groups.find(
              (group) => group.id === groupId,
            )
            ?.instruments.find(
              (candidateInstrument) => candidateInstrument.id === instrumentId,
            );

          get().updateInstrumentSettings(workspaceId, groupId, instrumentId, {
            activeNotes: resolveSettingValue(
              activeNotes,
              instrument?.activeNotes,
            ),
          });
        },
      }),
      {
        name: "muso-dojo-app-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state): AppStoreSnapshot => ({
          activeWorkspaceId: state.activeWorkspaceId,
          workspaces: state.workspaces,
        }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...normalizeAppStoreSnapshot(persistedState, initialSnapshot),
        }),
        migrate: (persistedState) =>
          normalizeAppStoreSnapshot(persistedState, initialSnapshot),
        skipHydration: true,
      },
    ),
    {
      name: "Muso Dojo",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

export function useHydrateAppStore() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const markHydrated = () => {
      hasCompletedHydration = true;

      if (isSubscribed) {
        setHasHydrated(true);
      }
    };
    const unsubscribeFromHydrationFinish =
      useAppStore.persist.onFinishHydration(markHydrated);

    if (hasCompletedHydration || useAppStore.persist.hasHydrated()) {
      markHydrated();

      return () => {
        isSubscribed = false;
        unsubscribeFromHydrationFinish();
      };
    }

    if (!hasRequestedHydration) {
      hasRequestedHydration = true;

      try {
        void Promise.resolve(useAppStore.persist.rehydrate()).catch(
          markHydrated,
        );
      } catch {
        markHydrated();
      }
    }

    return () => {
      isSubscribed = false;
      unsubscribeFromHydrationFinish();
    };
  }, []);

  return hasHydrated;
}
