# Arrangement Workspace Implementation Plan — Version 4

## 1. Feature definition

Add **Arrangements** as a second playable workspace type alongside Sessions.

A Session remains the editable workspace for creating Parts, modules, and
backing-band settings. An Arrangement captures complete Sessions as independent
Sections, orders occurrences of those Sections, assigns a play count to each
occurrence, and plays the resulting structure.

An Arrangement has two persisted playback modes:

- **Once**: play from the selected Entry to the end, then stop.
- **Loop**: play from the selected Entry to the end, then return to Entry 1 and
  loop the complete Arrangement until stopped.

The Arrangement workspace displays one Section Chart. Shortly before playback
moves to a different Section, the Chart changes to that upcoming Section so the
player can read ahead. The upcoming Chart is explicitly labeled and does not
highlight a chord until the exact musical boundary.

The existing **Session Library** becomes **Library**, containing Sessions and
Arrangements as sibling workspace types.

### 1.1 Terminology

- **Session**: an editable workspace containing ordered Parts, modules,
  backing-band configuration, and tempo.
- **Arrangement**: an ordered performance assembled from captured Sections.
- **Section**: one named, Arrangement-owned snapshot of a complete Session.
- **Entry**: one occurrence of a Section in the Arrangement order.
- **Play count**: the total number of times an Entry is performed. A play count
  of two is displayed as `×2`.
- **Source Session**: the Session from which a Section was captured. It is
  provenance and an explicit refresh source, not a live dependency.
- **Playback mode**: the Arrangement-wide choice between Once and Loop.
- **Chart cue**: the temporary, read-ahead presentation of the next different
  Section before its exact playback boundary.

Use **Entry** in implementation and accessibility copy where an occurrence
must be distinguished from its shared Section. Visible UI may use **Selected
Section** for the Entry editor.

### 1.2 Product boundaries

- Sections capture complete Sessions only.
- Arrangement playback uses one Arrangement-wide tempo.
- Captured backing-band settings remain Section-specific.
- Sections never update automatically from source Sessions.
- Refresh and replacement are explicit actions.
- Arrangement playback never writes to source Sessions.
- Parts and modules are not editable inside an Arrangement.
- Count-in occurs only once when playback starts.
- The Chart shows one Section rather than an expanded Arrangement.
- Chart cues affect presentation only; they never advance audio, active
  transport state, selection, or chord highlighting.

## 2. Required invariants

### 2.1 Snapshot ownership

- A Section is fully owned by its Arrangement.
- Editing, renaming, or deleting a source Session does not change its Section.
- The same Section may be referenced by multiple Entries.
- Renaming or replacing a Section updates all Entries that reference it.
- Capturing the same Session again creates a new independent Section.
- A Section is deleted when its final Entry is removed.
- An Arrangement remains playable after its source Sessions are deleted.

### 2.2 Naming

- Arrangement names are unique among Arrangements.
- Section names are unique within an Arrangement.
- Session name behavior remains unchanged.
- Names may repeat across workspace types.
- A new Arrangement uses `My Arrangement`, with numeric suffixes as needed.
- A Section initially uses its source Session name, with a numeric suffix when
  needed within the Arrangement.

Generalize name comparison, unique-name, and copy-name helpers in
`src/stores/app-store/entityIds.ts`.

### 2.3 Entry order and play counts

- Add Section appends an Entry.
- Selecting an existing Section appends an Entry referencing it.
- Selecting a Session captures a Section and appends its first Entry.
- Duplicate Entry inserts immediately after the selected Entry.
- Move Earlier and Move Later reorder one position at a time.
- `playCount` is an integer from 1 through 99.
- Selection is tracked by Entry ID and survives reordering.

### 2.4 Playability

- A Session with no Parts cannot be captured.
- Empty Sessions remain visible but disabled in source dialogs.
- An Arrangement with no Entries cannot play.
- A referenced Section with no valid Parts remains visible after defensive
  normalization.
- Any referenced Section with no valid Parts disables Arrangement playback.
- Invalid Sections are never skipped silently.

### 2.5 Mutation during playback

Stop active Arrangement playback before:

- adding a Section or Entry;
- reordering or duplicating an Entry;
- changing play count;
- removing an Entry;
- refreshing or replacing a Section.

Do not stop playback for:

- Arrangement rename;
- Section rename;
- Arrangement tempo change;
- Once/Loop change.

Tempo and Once/Loop changes update the active plan through reconciliation.

## 3. User experience

### 3.1 Library

Rename all **Session Library** copy to **Library**.

```text
LIBRARY

Create
  New Session
  New Arrangement

Sessions
  Verse
  Chorus

Arrangements
  Complete Song
```

Implementation:

- Generalize `SessionManagementDialog` to `WorkspaceLibraryDialog`.
- Retain the standard `Dialog` structure and `DisclosureList` rhythm.
- Add visible group headings with `Heading`.
- Continue using `SelectableOverflowRow`.
- Keep existing Session row behavior.
- Add Use, Rename, Duplicate, and Delete for Arrangement rows.
- Extend `ObjectManagementGroup` and `objectMenuCopy` with `arrangement`.

Arrangement subtitle:

```text
4 Sections · 7 Entries · 108 BPM
```

Append `· Loop` only when Loop is enabled.

Selecting a workspace closes Library and stops transport owned by the previous
workspace.

### 3.2 Creating an Arrangement

New Arrangement:

1. creates a unique `My Arrangement`;
2. sets `tempoBpm: 80`;
3. sets `playbackMode: "once"`;
4. makes it the active workspace;
5. closes Library;
6. opens the Arrangement workspace.

Empty state:

```text
No Sections Yet

[ Add First Section ]
```

Use a centered shared `Button` with Plus. Disable tempo until the first Section
is added. The first capture replaces 80 BPM with the source Session tempo.

### 3.3 Add Section dialog

```text
ADD SECTION

Sections in This Arrangement
  Verse                 Used 2 times
  Chorus                Used 1 time

Sessions
  Verse Session         4 Parts · 80 BPM
  Bridge Session        No Parts Yet
```

Implementation:

- Use a standard-width `Dialog` and `DisclosureListAction` rows.
- Hide the existing-Sections group when empty.
- Show every Session; disable Sessions with no Parts.
- Apply `preventConcurrentClicks` to capture actions.
- Close after selection.
- Select and scroll the appended Entry into view.
- If no Sessions exist, show **No Sessions Yet** and **Create Session**.

### 3.4 Arrangement header

Create `ArrangementHeader` using `ControlHeader`,
`ControlHeaderCluster`, `Heading`, `IconButton`,
`OverflowMenuButton`, and `ObjectMenuDialog`.

Control order:

1. Add Section;
2. Play/Stop;
3. Loop Arrangement;
4. Arrangement tempo;
5. overflow menu.

Use Lucide `Repeat2` for Loop Arrangement:

- `selected={playbackMode === "loop"}`;
- `aria-label="Loop arrangement. On"` when enabled;
- `aria-label="Loop arrangement. Off"` when disabled;
- available whenever an Arrangement is active;
- persists immediately.

Overflow menu:

- Rename Arrangement;
- Library;
- Dojo Settings.

Do not render Session-only controls.

### 3.5 Arrangement workspace

```text
ARRANGEMENT
[ Intro ] [ Verse ×2 ] [ Chorus ] [ Verse ]

SELECTED SECTION
Verse · Play 1 of 2
[ Entry and Section controls ]

CHART
Verse
| 01  G | 02  D  |
| 03 Em | 04  C  |
```

#### Sequence strip

- Render Entries as an ordered, horizontally scrollable list.
- Use `OptionButton` with `presentation="tile"`.
- Give tiles a stable minimum width and ellipsize long names.
- Show `×N` only when `playCount > 1`.
- Provide accessible text such as **plays 3 times**.
- Preserve selection by Entry ID.
- Auto-scroll only when the active Entry changes.
- Disable smooth scrolling under reduced motion.

Entry states:

- selected while stopped: shared selected styling;
- pending audio handoff: pending styling;
- playing: accent border and `aria-current="step"`;
- Chart-cued next Entry: a distinct **Up Next** marker;
- unavailable: shared disabled/dashed styling.

The Chart-cued marker must not replace `aria-current`, selection, or active
styling. The currently sounding Entry remains active until the boundary.

While playing:

- selection follows the active Entry at the exact boundary;
- manual Entry selection is disabled;
- stopping leaves the last active Entry selected.

While stopped:

- select Entry 1 initially;
- selecting an Entry updates the editor and Chart immediately;
- Play starts at play 1 of the selected Entry.

#### Selected Entry editor

Render controls only for the selected Entry.

Use:

- a bordered card;
- `ControlHeader` and `ControlHeaderCluster`;
- ListStart, ListEnd, Copy, and Trash `IconButton` actions;
- `NumericStepper` for Section plays;
- `DisclosureList` for Section actions.

Entry actions:

- Move Earlier;
- Move Later;
- Duplicate Entry;
- Section plays, 1 through 99;
- Remove from Arrangement.

Section actions:

- Rename Section;
- Refresh from Source;
- Replace from Session;
- Open Source Session.

Display:

- **Used N times in this Arrangement** for shared Sections;
- **Source changed since capture** when `lastModified` differs;
- **Source Session unavailable** when the source is missing.

Focus and selection:

- add/duplicate selects the new Entry;
- reorder retains Entry selection and action focus;
- remove selects the next Entry, or previous when removing the last Entry;
- removing the only Entry returns to the empty state.

### 3.6 Entry removal

Removing an Entry with other Section references needs no confirmation.

Removing the final Entry for a Section uses
`DisclosureListConfirmAction`:

```text
Remove Verse? Its captured Section will also be deleted.
```

Remove the Entry and Section atomically.

### 3.7 Refresh and replacement

Provide:

- **Refresh from Source**, enabled when the source exists;
- **Replace from Session…**, enabled when a playable Session exists.

Both:

- stop Arrangement playback;
- preserve Section ID and name;
- preserve Entry IDs, order, references, and play counts;
- recapture Parts, modules, backing-band configuration, and provenance;
- preserve Arrangement tempo and playback mode;
- retain selected Entry;
- warn when multiple Entries are affected.

Open Source Session switches workspaces and stops Arrangement playback through
owner reconciliation.

### 3.8 Tempo and count-in

`tempoBpm` is an integer from 30 through 300.

- First capture initializes it from `session.tempoBpm ?? 80`.
- Later capture/replacement preserves it.
- It overrides request tempo for every Arrangement Part, Rhythm, and Exercise
  Looper.
- It never changes source data.

The selected starting Section's captured count-in runs once. Do not count in at
Part, play-count, Entry, Section, or loop-wrap boundaries.

### 3.9 Once and Loop

| Mode | Initial start                | End behavior                 |
| ---- | ---------------------------- | ---------------------------- |
| Once | Play 1 of the selected Entry | Stop after the final Entry   |
| Loop | Play 1 of the selected Entry | Wrap to Entry 1 and continue |

- Starting Loop at Entry 1 repeats the complete Arrangement.
- Starting Loop later performs that suffix first, then repeats from Entry 1.
- Wrap is scheduled without count-in.
- The first Part after wrap uses a safe backing-band reset.
- Once to Loop wraps at the current traversal end.
- Loop to Once stops at the next Arrangement end.
- Mode changes do not restart the current Part.

### 3.10 Anticipatory Chart cue

Chart anticipation applies only while an Arrangement is playing and only when
the next performed Section has a different Section ID.

Default timing constants:

```ts
export const ARRANGEMENT_CHART_CUE_LEAD_SECONDS = 1;
export const ARRANGEMENT_CHART_CUE_MIN_SECONDS = 0.25;
```

Behavior:

1. Keep showing the active Section Chart normally.
2. Determine the audio-clock boundary for the next different Section.
3. Schedule the cue before that boundary.
4. At cue time, replace only the Chart with the upcoming Section.
5. Display **Up Next · {Section name}** above the Chart.
6. Show no active chord/Part highlight in the upcoming Chart.
7. Keep header readout, selected Entry editor, and `aria-current` on the
   currently sounding Entry.
8. At the exact boundary, make the upcoming Entry active, remove **Up Next**,
   and highlight its first active Part.

The cue is not shown when:

- playback is stopped;
- the next play/Entry uses the same Section ID;
- Once playback is on its final Section with no next Section;
- Loop contains no different Section;
- the usable lead would be shorter than
  `ARRANGEMENT_CHART_CUE_MIN_SECONDS`.

For a short current Section, preserve time to read the current Chart:

```ts
effectiveLeadSeconds = Math.min(
  ARRANGEMENT_CHART_CUE_LEAD_SECONDS,
  currentSectionDisplayDurationSeconds / 2,
);
```

If `effectiveLeadSeconds < ARRANGEMENT_CHART_CUE_MIN_SECONDS`, switch the Chart
only at the exact boundary.

Section display duration begins when a Section ID becomes active and continues
across adjacent plays or Entries that reference the same Section ID. A cue is
scheduled only for the next different Section.

Edge behavior:

- Loop wrap may cue Entry 1 when its Section differs from the final active
  Section.
- Loop to Once cancels an active wrap cue and restores the current Section
  Chart.
- Once to Loop may add a wrap cue if enough time remains.
- Tempo changes recalculate cue timing without changing active playback.
- Once an upcoming Chart is visible, retain it across intervening active Part
  changes while its target Section and boundary remain unchanged.
- Stopping during a cue restores the last active/selected Section Chart.
- Structural mutations stop playback and clear the cue.
- A stale timer verifies owner, source signature, active Section run, target
  Section, and boundary before changing presentation.

Do not use `pendingArrangementContext` as the Chart cue trigger. Pending audio
state begins according to `AUDIO_SCHEDULER_HORIZON_SECONDS`, which is an audio
reliability setting rather than a presentation contract.

## 4. Component and CSS integration

| Requirement              | Existing component or pattern                          |
| ------------------------ | ------------------------------------------------------ |
| Workspace header         | `ControlHeader`, `ControlHeaderCluster`, `Heading`     |
| Header actions           | `IconButton`, `OverflowMenuButton`, `ObjectMenuDialog` |
| Library rows             | `SelectableOverflowRow`                                |
| Dialogs                  | `Dialog*`                                              |
| Choice/action lists      | `DisclosureList*`                                      |
| Sequence tiles           | `OptionButton` tile presentation                       |
| Entry card               | Custom Progression bar-card pattern                    |
| Reorder/duplicate/remove | Custom Progression icon actions                        |
| Play count               | `NumericStepper`                                       |
| Rename                   | generalized `InlineRenameActionItem`                   |
| Confirm removal          | `DisclosureListConfirmAction`                          |
| Empty state              | shared `Button` with Plus                              |
| Current/upcoming Chart   | extracted Session Chart                                |

Arrangement CSS adds only layout and state rules. Use global tokens for
spacing, control sizes, surfaces, borders, accent, radii, transitions, and
motion preferences.

Chart cue presentation:

- use existing muted typography for **Up Next**;
- use the Section name as normal text;
- give the cued Entry a border/marker derived from `--color-accent`;
- do not dim the upcoming chords enough to reduce readability;
- do not animate the Chart with motion under `prefers-reduced-motion`;
- do not add hard-coded colors or theme overrides.

## 5. Data model

Create `src/types/arrangement.ts`.

```ts
export type ArrangementPlaybackMode = "once" | "loop";

export interface ArrangementSectionSource {
  sessionId: string;
  sessionName: string;
  sessionLastModified: string;
  sessionTempoBpm: number;
  capturedAt: string;
}

export interface ArrangementSectionConfig {
  id: string;
  name: string;
  source: ArrangementSectionSource;
  backingBand: SessionBackingBandConfig;
  parts: MusicPartConfig[];
}

export interface ArrangementEntryConfig {
  id: string;
  sectionId: string;
  playCount: number;
}

export interface ArrangementConfig {
  id: string;
  name: string;
  lastModified: string;
  tempoBpm: number;
  playbackMode: ArrangementPlaybackMode;
  sections: ArrangementSectionConfig[];
  entries: ArrangementEntryConfig[];
}

export type ActiveWorkspaceRef =
  { kind: "session"; id: string } | { kind: "arrangement"; id: string } | null;

export interface AppStoreSnapshot {
  activeWorkspace: ActiveWorkspaceRef;
  arrangements: Record<string, ArrangementConfig>;
  dojoSettings: DojoSettings;
  sessions: Record<string, SessionConfig>;
  sessionWorkspaceViewMode: SessionWorkspaceViewMode;
}
```

Do not persist:

- selected Entry;
- Chart cue state or timing constants;
- playback plans or transport snapshots;
- derived Chart plans.

## 6. Normalization, migration, and persistence

Add Arrangement defaults, config/Section normalizers, and validation under
`src/utils/arrangement/`.

Normalize:

- names with shared name helpers;
- tempo to integer 30–300, default 80;
- playback mode to Once or Loop, default Once;
- play count to integer 1–99, default 1;
- Parts with `normalizeMusicPartConfig`;
- backing band with `normalizeSessionBackingBandConfig`;
- Arrangement IDs at top level;
- Section/Entry IDs within Arrangement;
- Part IDs within Section;
- module IDs within Part.

Drop dangling Entries, prune unreferenced Sections, and preserve referenced
empty Sections as invalid/playback-blocking.

Migration:

- bump `APP_STORE_VERSION`;
- add `arrangements` to partialization;
- replace `activeSessionId` with `activeWorkspace`;
- migrate a valid active Session to `{ kind: "session", id }`;
- fall back to first Session, first Arrangement, then `null`;
- preserve valid legacy Sessions, Dojo settings, and Session view mode.

Persistence capacity:

- test realistic large Sections;
- ensure repeated Entries do not duplicate Section data;
- keep derived plan/Chart/cue data out of storage;
- surface failed `localStorage` writes with
  **Changes could not be saved on this device**;
- clear the warning after a successful write.

Store complete normalized `MusicPartConfig` snapshots.

## 7. Store actions

Create `arrangementActions.ts` and add `ArrangementActions`.

Required actions:

```ts
setActiveWorkspace(workspace: ActiveWorkspaceRef): void;
addArrangement(settings?: { name?: string }): string;
cloneArrangement(arrangementId: string): string | undefined;
removeArrangement(arrangementId: string): void;
renameArrangement(arrangementId: string, name: string): void;
setArrangementTempoBpm(arrangementId: string, tempoBpm: number): void;
setArrangementPlaybackMode(
  arrangementId: string,
  mode: ArrangementPlaybackMode,
): void;
addArrangementSectionFromSession(
  arrangementId: string,
  sessionId: string,
): { sectionId: string; entryId: string } | undefined;
appendArrangementSectionEntry(
  arrangementId: string,
  sectionId: string,
): string | undefined;
replaceArrangementSectionFromSession(
  arrangementId: string,
  sectionId: string,
  sessionId: string,
): boolean;
renameArrangementSection(
  arrangementId: string,
  sectionId: string,
  name: string,
): void;
moveArrangementEntry(
  arrangementId: string,
  entryId: string,
  direction: "earlier" | "later",
): void;
cloneArrangementEntry(
  arrangementId: string,
  entryId: string,
): string | undefined;
setArrangementEntryPlayCount(
  arrangementId: string,
  entryId: string,
  playCount: number,
): void;
removeArrangementEntry(arrangementId: string, entryId: string): void;
```

Actions validate IDs, reject empty source Sessions, preserve state identity for
no-ops, update `lastModified`, and remain audio-agnostic.

## 8. Capture and graph cloning

Implement one graph-aware clone:

```ts
cloneMusicPartGraph(parts, {
  createPartId,
  createModuleId,
  createProgressionInstanceId,
});
```

It:

1. deep-copies Parts and modules;
2. creates fresh Part/module IDs;
3. repairs `PartBandConfig` module references;
4. creates one new ID per distinct authored progression instance;
5. preserves shared progression grouping;
6. normalizes cloned Parts;
7. preserves order;
8. leaves sources untouched.

Use it for Section capture/refresh/replacement, Arrangement duplication, and
compatible existing clone flows.

Capture complete normalized Parts, modules, backing band, and source
provenance. Source identity, timestamp, name, and tempo are informational.

First capture initializes Arrangement tempo. Later capture/replacement
preserves tempo and playback mode. Arrangement duplication creates fresh IDs at
every owned level.

## 9. Workspace architecture

Refactor `src/app/dojo/page.tsx`:

```text
HydratedDojoWorkspace
  shared lifecycle and Library
  SessionWorkspace
  ArrangementWorkspace
```

Shared responsibilities:

- routing by `activeWorkspace`;
- audio warm-up;
- visibility stop;
- playback-owner reconciliation;
- Library and Dojo Settings.

Arrangement responsibilities:

- selected Entry;
- source dialogs;
- sequence editor;
- tempo and Once/Loop;
- transport;
- Chart cue presentation;
- current/upcoming Chart.

Add selectors:

```ts
selectActiveSessionId(state): string | null;
selectActiveArrangementId(state): string | null;
selectActiveWorkspace(state): ActiveWorkspaceRef;
```

## 10. Playback planning

### 10.1 Neutral plan types

```ts
export type PlaybackSequenceOwner =
  { kind: "session"; id: string } | { kind: "arrangement"; id: string };

export type PlaybackCompletionPolicy = "loop" | "stop-at-end";

export interface PartSequencePlaybackPlan {
  owner: PlaybackSequenceOwner;
  completionPolicy: PlaybackCompletionPolicy;
  mode: "session" | "part-loop" | "arrangement";
  steps: readonly PartSequenceStepPlan[];
  tempoBpm: number;
  sourceSignature: string;
  contentSignature: string;
  updateSignature: string;
  stepResetSignatures: readonly string[];
}

export interface PartSequenceStartOptions {
  startIndex: number;
  countIn: BeatTransportCountIn;
}

export interface PartSequencePlaybackRequest {
  plan: PartSequencePlaybackPlan;
  start: PartSequenceStartOptions;
}
```

Session and Part-loop use Loop completion and start index zero. Arrangement
maps Once to Stop At End and Loop to Loop.

Signatures:

- source: owner, mode, ordered step/source structure;
- content/reset: audio state requiring current-step restart;
- update: tempo, completion policy, live audio values;
- exclude Arrangement and Section names.

### 10.2 Reusable Part planning

Extract planning from `createPartSequencePlaybackPlan` with inputs for Parts,
backing band, tempo, namespaces, source metadata, first-step continuation, and
cycle-wrap continuation.

Arrangement invokes it per Entry play:

- Section Parts/backing band;
- Arrangement tempo;
- unique Entry/play namespace;
- no first-step continuation;
- no subplan wrap continuation.

Preserve current internal Section Part-to-Part behavior. Force safe reset at
every Entry play boundary.

### 10.3 Arrangement expansion

Expand transiently:

```text
Entry order → play count → Section Parts
```

```ts
export interface ArrangementStepContext {
  entryId: string;
  entryIndex: number;
  sectionId: string;
  playIndex: number;
  playCount: number;
  sourcePartId: string;
}

export interface PartSequenceStepPlan {
  stepId: string;
  sourcePartId: string;
  arrangement?: ArrangementStepContext;
  // duration/request/signature fields
}
```

Namespace Rhythm and Exercise Looper request IDs by Arrangement, Entry, play
index, and source ID.

Build the full plan even when starting from a later Entry. Return `startIndex`
for play 1 of the selected Entry and count-in from that Section.

## 11. Sequence coordinator

### 11.1 Start and completion

```ts
start(plan, { startIndex, countIn });
```

- validate and start at `startIndex`;
- count in once;
- expose pending/active step context.

Loop:

- wrap final step to step zero;
- omit count-in at wrap;
- continue until stopped.

Stop At End:

- never modulo beyond final step;
- stop at the exact final boundary;
- clear timers/state and Part-sequence-owned audio;
- emit idle/completed state.

Recovery stops when a finite boundary has passed.

### 11.2 Live updates

Preserve performed occurrence, active step, origin time, and musical position.
Do not reset occurrence to active index after loop wrap.

- tempo updates live;
- Once to Loop wraps at end;
- Loop to Once stops at next end;
- names do not affect plan;
- structural mismatch stops.

### 11.3 Snapshot and clock

```ts
export interface PartSequenceSnapshot {
  playing: boolean;
  owner?: PlaybackSequenceOwner;
  mode?: PartSequencePlaybackPlan["mode"];
  completionPolicy?: PlaybackCompletionPolicy;
  activeIndex?: number;
  activeOccurrence?: number;
  activeStepId?: string;
  activeSourcePartId?: string;
  activeArrangementContext?: ArrangementStepContext;
  pendingIndex?: number;
  pendingStepId?: string;
  pendingArrangementContext?: ArrangementStepContext;
  originTime?: number;
  cycleEndTime?: number;
  stepCount: number;
  tempoBpm?: number;
  sourceSignature?: string;
}
```

Expose a read-only coordinator method:

```ts
getClockTime(): number | undefined;
```

It returns the transport audio clock and is used only to convert a Chart cue's
audio boundary into a browser timer delay. It does not permit presentation code
to mutate transport.

## 12. Transport and Chart cue hooks

### 12.1 Arrangement transport

Create `useArrangementTransport(arrangementId, selectedEntryId)`.

Return:

- `canPlay`;
- `isActive`;
- `readout`;
- `plan`;
- `togglePlayback`;
- scoped shortcuts.

Build the full plan, start from selected Entry, follow active Entry context,
update tempo/mode live, and stop on structure/owner deletion changes.

Generalize global shortcuts for the active workspace.

### 12.2 Cue derivation

Create:

- `src/utils/arrangement/arrangementChartCue.ts`;
- `src/hooks/audio/useArrangementChartCue.ts`.

Pure derivation input:

```ts
interface ArrangementChartCueInput {
  plan: PartSequencePlaybackPlan;
  snapshot: PartSequenceSnapshot;
  currentSectionStartedAt: number;
}
```

Pure derivation output:

```ts
interface ArrangementChartCueTarget {
  boundaryTime: number;
  cueTime: number;
  effectiveLeadSeconds: number;
  entryId: string;
  sectionId: string;
  sourceSignature: string;
  fromOccurrence: number;
}
```

Derivation:

1. Start from `activeOccurrence`.
2. Use `cycleEndTime` as the end of the active step.
3. Scan subsequent performed steps, summing duration at current tempo.
4. Respect Stop At End; do not scan past the final step.
5. Respect Loop; scan across wrap.
6. Stop after at most one complete plan traversal.
7. Find the first step whose Section ID differs from the active Section.
8. Compute its boundary time.
9. Compute effective lead using the constants and Section display duration.
10. Return no target when the lead is too short.

`useArrangementChartCue`:

- records `currentSectionStartedAt` when active Section ID changes;
- retains that start across adjacent same-Section plays/Entries;
- schedules a separate browser timer from `getClockTime()`;
- exposes either current or upcoming Chart presentation;
- clears/recalculates on owner, signature, occurrence, tempo, mode, or Section
  changes;
- retains the timer or visible upcoming presentation when recalculation produces
  the same target Section and boundary, so intervening Part commits cannot make
  the Chart flicker back to the current Section;
- validates snapshot and target again when the timer fires;
- clears immediately on stop/unmount.

Presentation model:

```ts
type ArrangementChartPresentation =
  | {
      kind: "current";
      entryId: string;
      sectionId: string;
      activeSourcePartId?: string;
    }
  | {
      kind: "upcoming";
      entryId: string;
      sectionId: string;
      boundaryTime: number;
    };
```

Do not put cue state in Zustand or `PartSequenceCoordinator`.

## 13. Chart extraction and rendering

Extract the Chart from `SessionView.tsx`:

```tsx
<SessionChart
  parts={parts}
  backingBand={backingBand}
  activePartId={activePartId}
  ariaLabel={ariaLabel}
/>
```

Move Chart CSS with the component.

Session:

- passes live Session data;
- retains exact-beat Chart behavior;
- does not use Arrangement cue logic.

Arrangement current presentation:

- renders active/selected Section;
- passes active source Part only when Section IDs match.

Arrangement upcoming presentation:

- renders target Section;
- passes no active Part;
- labels the region **Up Next · {name}**;
- marks target Entry as Chart-cued without changing selection/current state.

At boundary, the same upcoming Chart becomes current and receives the active
Part highlight. Avoid remounting it solely because `kind` changed when Section
ID is unchanged.

Always mount one Chart and zero `MusicPartView` components. Do not render
non-presented Sections or duplicate Charts for repeats.

## 14. Accessibility and responsive behavior

- Entry tiles are keyboard-selectable while stopped.
- Entry action labels include Section and position.
- Loop exposes pressed state and On/Off copy.
- `aria-current="step"` remains on the sounding Entry during a Chart cue.
- The cued Entry has accessible **Up next** text without current semantics.
- One polite live message announces **Up next, {Section}** at cue time.
- Do not repeat that announcement at the boundary.
- Do not announce scheduler pending state, every beat, or loop count.
- Focus is stable after all Entry and Section actions.
- Sequence strip scrolls horizontally with visible focus rings.
- Shared headers/actions wrap on narrow screens.
- Reduced motion disables smooth scroll and Chart transition animation, but
  does not disable the anticipatory cue itself.

## 15. Implementation sequence

Keep New Arrangement unavailable in production until completion.

### Phase 1 — Data, names, and cloning

- Generalize name helpers.
- Add graph-aware Part cloning and tests.
- Add Arrangement types/defaults/normalizers.
- Add progression-instance remapping.

### Phase 2 — Store and persistence

- Add Arrangements and active workspace migration.
- Add actions and validation.
- Add Once/Loop persistence.
- Add persistence capacity/failure handling.

### Phase 3 — Workspace and Library

- Split shared/Session/Arrangement ownership.
- Add selectors and workspace reconciliation.
- Replace Session Library with Library.
- Add Arrangement management and empty workspace.

### Phase 4 — Arrangement editor

- Add header and Once/Loop control.
- Add capture/replacement dialogs.
- Add sequence strip, selection, Entry editor/actions, and source management.

### Phase 5 — Playback

- Generalize plan ownership/types.
- Extract reusable planning.
- Expand full Arrangement plan.
- Add start index, loop, stop-at-end, performed occurrence, and live updates.
- Add Arrangement transport and shortcuts.

### Phase 6 — Chart and cue

- Extract shared Chart.
- Add current Arrangement Chart.
- Add cue derivation utility and hook.
- Add Up Next presentation and exact-boundary highlight transition.
- Complete accessibility, timing, responsive, persistence, and rendering
  tests.
- Expose New Arrangement.

## 16. Test plan

### 16.1 Data/store/persistence

- Legacy active Session migrates without data loss.
- Arrangement round-trip retains Sections, Entries, tempo, and Once/Loop.
- Invalid values normalize safely.
- Empty Sections block playback.
- Captures and duplicates have fresh, repaired nested IDs.
- Source edits/deletion do not affect Sections.
- Actions update timestamps and preserve identity on no-op.
- Final Entry removal deletes Section atomically.
- Large snapshots persist or show a storage warning.

### 16.2 Editor and Library

- Session behavior remains functional in Library.
- New Arrangement starts empty in Once mode.
- Add Section groups and disables correctly.
- Entry add/duplicate/reorder/remove preserves selection/focus.
- Source status and multi-reference replacement behave correctly.
- Loop control persists and exposes correct state.

### 16.3 Once and Loop playback

- `A ×2 → B → A` plays in exact order.
- Once stops at the exact end.
- Starting Once at B performs `B → A`.
- Loop from Entry 1 repeats the full Arrangement.
- Loop from B performs the suffix, then full Arrangement.
- Wrap has no count-in and uses a safe reset.
- Once/Loop live changes take effect at the next end.
- Tempo changes after wrap preserve occurrence and position.
- Step/request IDs are unique and source Part IDs remain available.

### 16.4 Chart cue timing

- A different next Section is shown at its computed cue time.
- The cue uses one second when Section duration allows.
- Short Sections use half their display duration.
- Leads below 0.25 seconds produce no early cue.
- Adjacent plays/Entries with the same Section ID do not cue.
- The first different Section after repeated same-Section Entries is cued.
- Upcoming Chart has no active Part highlight.
- Current Entry remains selected and `aria-current` until boundary.
- At boundary, the cued Chart becomes current and highlights the active Part.
- Once final Section has no cue.
- Loop final Section cues Entry 1 only when Section IDs differ.
- All-same-Section loops produce no cue.
- Loop to Once cancels a wrap cue.
- Once to Loop schedules a wrap cue when time permits.
- Tempo change reschedules cue correctly.
- Intervening active Part changes do not hide or restart a visible cue for the
  same target and boundary.
- Stop during cue restores current/selected Chart.
- Stale timers cannot show an obsolete Section.
- Scheduler pending timing does not determine cue timing.

### 16.5 Rendering/accessibility

- Arrangement mounts one Chart and zero `MusicPartView` trees.
- Repeats and non-presented Sections do not create Chart DOM.
- Cue-to-current transition retains the same Chart when Section ID is stable.
- Up Next is visible and announced once.
- Sounding Entry retains current semantics during cue.
- No beat-level announcement noise.
- Narrow layout remains keyboard-operable.
- Reduced motion removes animation but retains cue timing.
- All themes use shared tokens with adequate contrast.

## 17. Acceptance criteria

The feature is complete when a user can:

1. Create and manage Sessions and Arrangements from Library.
2. Capture complete Sessions as independent Sections.
3. Build structures such as `A ×2 → B → A`.
4. Play once from a selected Entry or loop the complete Arrangement.
5. Change Once/Loop and tempo without restarting the current Part.
6. Hear one initial count-in and no internal/wrap count-ins.
7. Hear captured backing behavior without cross-Section leakage.
8. See the next different Section Chart shortly before its boundary.
9. Clearly distinguish an Up Next Chart from the currently sounding Entry.
10. See no chord highlighted in Up Next until the exact boundary.
11. See the correct first active Part highlight at the boundary without a
    second Chart page change.
12. Retain exact-beat Chart behavior in ordinary Session playback.
13. Refresh/replace Sections explicitly and survive source deletion.
14. Use long Arrangements accessibly on narrow screens.
15. Reload with Arrangement tempo and mode preserved, or receive a persistence
    warning.
