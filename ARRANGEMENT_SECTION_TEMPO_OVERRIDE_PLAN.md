# Arrangement Section Playback and Tempo Overrides — Version 2

## Summary

Add an optional tempo override to each visible Arrangement Section position (an
Arrangement Entry), together with a transient `Loop This Section` transport.
Sessions retain their existing single, live-editable tempo. Each Section gets a
single playback-options dialog, mirroring the existing Part playback dialog,
instead of a dedicated tempo control in every Section header.

This fits the current playback architecture without a special parallel
transport. The sequence plan gains a required tempo per step, and the existing
Part sequence coordinator becomes tempo-map-aware through shared timing helpers.
Its snapshot continues to describe the committed audible step while a queued
handoff is represented separately. Full-Arrangement and single-Entry loops use
the same planner and coordinator. The Arrangement-level plan tempo remains as
compatibility metadata only and is not used for scheduling.

## Data Model and Store

- Add `tempoOverrideBpm?: number` to `ArrangementEntryConfig`.
- Define effective Entry tempo as
  `entry.tempoOverrideBpm ?? arrangement.tempoBpm`.
- Add
  `setArrangementEntryTempoOverrideBpm(arrangementId, entryId, tempoBpm: number | undefined)`.
  The action:
  - accepts only integer BPM values from 30 through 300;
  - removes the property when passed `undefined`;
  - preserves an explicit override when it equals the current Arrangement BPM;
  - rejects invalid, missing-Arrangement, and missing-Entry writes without
    changing state or `lastModified`;
  - touches the Arrangement only when the stored override actually changes.
- New Entries inherit the Arrangement tempo without storing an override.
  This applies to first capture and to appending an existing captured Section.
- Duplicating an Entry copies its override into the new Entry. Subsequent edits
  to either Entry are independent.
- Cloning an Arrangement copies every override while continuing to remap
  Arrangement, Section, and Entry IDs as it does today.
- Replacing or refreshing captured Session content preserves all Entry
  overrides, including different overrides on several Entries that reference
  the same captured Section.
- Changing the Arrangement BPM leaves absolute overrides unchanged. An explicit
  override equal to the old Arrangement BPM therefore remains selected and
  keeps the old value after the Arrangement BPM changes.

## Normalization, Persistence, and Backup

- Normalize an Entry override strictly: retain it only when it is an integer in
  the inclusive 30–300 range; otherwise omit it. Do not use the existing
  clamp-and-round helper for this optional field.
- Keep legacy Entries valid through the inherited-tempo fallback.
- Increment `APP_STORE_VERSION` from 13 to 14 and update the corresponding unit
  assertion and E2E fixture version.
- Continue using normal snapshot normalization as the migration. No custom
  destructive migration is needed for this additive optional field.
- Keep the override optional in backup structural validation; normalization
  sanitizes it after parsing.
- Cover persisted-state hydration, old-version migration, backup export/restore,
  and Arrangement cloning. A backup produced by version 14 must retain explicit
  equal-valued overrides as well as distinct overrides.

## Playback Plan Contract

- Add required `tempoBpm: number` to `PartSequenceStepPlan`.
- Session and Part-loop planning assign the Session tempo to every selected
  step and to that step's exercise and rhythm requests.
- Arrangement planning computes the Entry's effective tempo before expanding
  it. Pass that tempo into the captured Section's Session-plan construction so
  every expanded Part, repeated play, exercise request, and rhythm request is
  created with the same effective Entry tempo.
- Retain `PartSequencePlaybackPlan.tempoBpm`:
  - for Session and Part-loop plans it remains the Session tempo;
  - for Arrangement plans it remains the Arrangement-level tempo;
  - it is compatibility/default metadata and must not be used for sequence
    duration, boundary, recovery, count-in, or transport scheduling.
- Retain the existing `parts`/`steps` compatibility shape; both references must
  expose steps carrying `tempoBpm`.
- Extend `PartSequencePlaybackPlan.mode` with `"arrangement-entry-loop"`.
  This is an Arrangement-owned plan containing one visible Entry and using the
  existing `"loop"` completion policy; it is not a separate audio transport.

## Centralized Tempo-Map Timing

Refactor the Part sequence coordinator around small shared helpers instead of
replacing plan-level tempo reads ad hoc:

- Resolve the step for an occurrence using the existing completion policy.
- Calculate a step's duration as
  `step.durationBeats * 60 / normalized(step.tempoBpm)`.
- Calculate sequence duration by summing all step durations.
- Calculate an occurrence offset from the sum of the preceding step durations,
  plus complete mixed-tempo cycle durations for looping plans.
- Use those helpers for sequence-origin reconstruction, handoff timing, late
  recovery, skipped occurrences, loop wrap, finite ending, and live plan
  updates.
- Pass the selected step's tempo to `BeatTransportCoordinator.startPart`.
  Exercise and rhythm request tempos must agree with it.
- Time the initial count-in using the first selected step's tempo, including
  when that step has no exercise or rhythm request.
- Calculate Chart pre-cue boundaries by accumulating each intervening step's
  duration at that step's tempo.

Add a coordinator test whose plan-level BPM intentionally differs from all step
tempos. Exact boundaries, transport arguments, and finite ending must still be
derived exclusively from the step tempos.

## Committed and Pending Tempo Lifecycle

Keep one coherent snapshot state machine rather than introducing a separate
Arrangement transport:

- `PartSequenceSnapshot.tempoBpm` is the current transport-grid tempo:
  - while a Part is committed, it is that audible step's tempo;
  - during the initial count-in/start, before any Part has committed, it is the
    starting step's tempo.
- Add optional `pendingTempoBpm` alongside the existing pending Part fields.
- When scheduling a handoff:
  - preserve the committed `tempoBpm` while the outgoing Part remains active;
  - set `pendingTempoBpm` to the incoming step tempo;
  - do not change active context, occurrence, origin, or cycle end early.
- When the handoff commits, atomically move the incoming step into the active
  fields, set `tempoBpm` to its tempo, and clear all pending fields including
  `pendingTempoBpm`.
- Initial start may set both the current grid tempo and pending tempo to the
  first step tempo; commit clears the pending value.
- `restartCurrentPart` and `retimeCurrentPart` use the snapshot's committed
  `tempoBpm` for the outgoing beat grid. They must not read the compatibility
  `committedPlan.tempoBpm`.
- Stopping resets both tempo fields with the rest of the snapshot. Existing
  revision checks continue to reject stale asynchronous starts and commits.

This preserves the current coordinator's single source of truth: pending state
describes already-queued Web Audio work, while active state changes only at the
audible commit boundary.

## Tempo Signatures and Reconciliation

- Add required `tempoSignature` to `PartSequencePlaybackPlan` and optional
  `tempoSignature` to `PartSequenceSnapshot`.
- Derive it deterministically from the ordered normalized step tempos and stable
  step IDs. Repeated plays remain represented because each expanded step already
  has a namespaced ID.
- Keep `sourceSignature` structural and tempo-free. Keep reset/content
  signatures tempo-free so a tempo edit does not masquerade as a content edit.
- Include `tempoSignature` in the aggregate plan `signature` and
  `updateSignature`, while still comparing it explicitly before ordinary update
  reconciliation.
- Reconcile in this order:
  1. Missing plan or changed structural `sourceSignature`: stop.
  2. Changed `tempoSignature`: retime Session/Part-loop playback, but stop
     full-Arrangement and Arrangement-Entry-loop playback.
  3. Otherwise apply the existing none/defer/restart/update rules.
- A tempo-signature mismatch takes precedence over a queued handoff. Stopping
  increments the coordinator revision and cancels Part-sequence playback so a
  stale queued handoff or commit cannot survive.
- When Session retiming queues a replacement, publish the new plan-level
  `tempoSignature` immediately to prevent duplicate reconciliation, while
  retaining the outgoing active `tempoBpm` until the replacement commits.

## Arrangement Boundary Behaviour

- Preserve the existing forced Rhythm restart at the first Part of every
  expanded Arrangement Entry play. This includes repeated plays, duplicated
  Entries, and loop wrap.
- At a boundary, outgoing exercise/rhythm playback is stopped and incoming
  playback starts at the same absolute time. The new requests and transport
  call use the incoming step tempo, and `preserveRhythms` is false.
- Do not add count-ins between Entries or repeated plays; only the Arrangement's
  initial first-step count-in is used.

## Section Loop Transport

- Add an Arrangement planning entry point for one visible Entry, such as
  `createArrangementEntryLoopPlaybackRequest(arrangement, entryId)`.
- Build the loop from that Entry's captured Section Parts and effective Entry
  tempo. Preserve its Entry context and namespaced step identities so active UI
  state and signatures still refer to the correct visible position.
- Expand the Entry content once per loop cycle, regardless of its stored
  `playCount`. `playCount` controls repetition in the full Arrangement; it is
  redundant once the selected Section is looping indefinitely.
- Use the captured Section's count-in once when the loop starts. Do not replay
  the count-in on loop wrap.
- Set the plan owner to the Arrangement, the mode to
  `"arrangement-entry-loop"`, and the completion policy to `"loop"`.
- Add a Section-loop transport hook parallel to the existing Part-loop hook. It
  reports active only when the snapshot owner is the Arrangement, the mode is
  `"arrangement-entry-loop"`, and the active or pending context has the same
  `entryId`.
- Starting a Section loop uses the normal exclusive transport handoff: stop any
  current transport playback, prepare audio, and start the Entry-loop plan.
  Clicking `Stop` for the active Entry loop stops it.
- Teach `useArrangementTransport` to reconcile the active Entry-loop plan when
  its Arrangement owns `"arrangement-entry-loop"` playback, following the
  existing Session `part-loop` precedent. It must not compare an Entry loop to
  the full-Arrangement plan and immediately stop it as structurally stale.
- The Arrangement header transport treats any playback owned by that
  Arrangement as active, so its existing button remains a reliable global Stop.
- Tempo enabling, editing, or clearing while an Entry loop is active stops the
  loop before changing state and never resumes it automatically. Live retiming
  of Arrangement Entry loops remains out of scope.

## Chart Identity and Pre-Cue Behaviour

- Treat `entryId`, not captured `sectionId`, as the identity of a visible Chart
  position.
- Update Chart run tracking and next-boundary discovery so:
  - a different `entryId` is a new visible Section even when both Entries share
    the same captured `sectionId`;
  - another `playIndex` within the same Entry remains part of the same displayed
    Section;
  - boundary time accumulates every intervening step at its own tempo.
- Include `tempoSignature` in the Chart cue target/staleness comparison. A
  stopped or superseded tempo map must invalidate any scheduled pre-cue timer.

## Section Playback Dialog and Owner-Scoped Stops

- In each Arrangement/Build Section header, add one icon-only playback-options
  button using the same `Disc3` visual language as the existing Part playback
  button. Do not add a dedicated Gauge or visible BPM readout to the header.
- Place the playback button before the reorder and management clusters. Keep it
  enabled whenever the Entry exists, including during full-Arrangement
  playback and when captured content is unavailable.
- Title the dialog `Playback for Section NN` and use the `Disc3` icon. Opening,
  inspecting, or closing it does not stop playback or change persisted state.
- Give the header button an accessible label that includes the Section number,
  effective BPM, inherited-versus-override status, and whether that exact
  Section loop is active. Use selected styling only while that exact Entry loop
  is active, not merely because a tempo override exists.
- Add a Tempo disclosure row inside the dialog using a Gauge icon and a concise
  preview:
  - inherited: `Arrangement Tempo · NNN BPM`;
  - overridden: `Override · NNN BPM`.
- Expanding Tempo reveals two explicit choices and the existing
  `SessionTempoEditor`:
  - `Arrangement Tempo`: preview the current Arrangement BPM and clear the
    override immediately when selected;
  - `Override`: when newly selected, immediately store the current Arrangement
    BPM as an explicit override and reveal the editor.
- Before enabling, editing, or clearing an override, synchronously stop playback
  only when that Arrangement owns it. Apply the mutation afterward and never
  resume automatically. Merely expanding the Tempo disclosure is non-mutating
  and does not stop playback.
- BPM edits apply immediately; closing is not cancellation. Ensure a pending
  debounced slider commit is cancelled when its editor unmounts so clearing the
  override cannot be followed by a stale delayed write.
- Keep the established term `Arrangement Tempo` and explain briefly that
  Sections inherit it unless overridden.
- Mirror the Part playback dialog footer: a secondary
  `Loop This Section`/`Stop` action and a primary `Close` action. Disable looping
  when the captured Section has no playable Parts, while leaving Tempo
  available. Starting or stopping the loop does not close the dialog.
- Keep Session selection and play count in the Section body, and reorder,
  duplicate, and removal in the header. They are composition controls, not
  Section playback settings.
- Keep Duplicate and Remove as header-only quick actions; do not repeat them in
  the Section Playback dialog. Retain their existing management cluster, with
  Remove as the rightmost danger-toned action and separated from the reorder
  cluster.
- Duplicate remains immediate. Before duplicating, synchronously stop playback
  only when that Arrangement owns it. Insert the copy after the source Entry,
  select it, close any Entry-local editor belonging to the source, and scroll
  the new Entry into view without opening its Playback dialog.
- Remove remains an intentionally immediate action with no confirmation and no
  Undo in this version, including when the Entry is the final reference to its
  captured Section. Keep the user-facing verb `Remove`, because the action
  removes a visible position from the Arrangement; preserve the existing store
  behavior that prunes captured Section content when its final Entry is removed.
- Before removal, synchronously stop playback only when that Arrangement owns
  it. After removal, select and focus the next Entry's playback button, falling
  back to the previous Entry; when no Entry remains, move focus to the first
  available empty-state action or Arrangement header control. Close any dialog
  or inline editor whose Entry no longer exists.
- The Arrangement-header tempo button remains a dedicated tempo editor, keeps
  its existing empty-Arrangement disabled state, and stops playback only when
  that Arrangement owns it before opening.
- Library editing uses an owner-aware `onBeforeOpen` callback around the shared
  Arrangement tempo action. Editing Arrangement A stops playback only if
  Arrangement A owns it; editing an inactive Arrangement must not stop Session,
  manual, or another Arrangement's playback.
- Do not put Arrangement-specific playback knowledge inside the generic
  `TempoActionItem` or `SessionTempoEditor`.
- Do not add override indicators to Chart tiles or Library summaries in this
  version.

## Tests and Acceptance Criteria

### Store and Persistence

- Enable, edit, clear, invalid-write rejection, no-op behavior, and
  `lastModified` behavior.
- Preserve explicit equal-valued overrides when Arrangement tempo changes.
- Strictly discard invalid persisted values rather than clamping them.
- Legacy snapshot fallback, version-13 migration, version-14 persistence,
  backup round-trip, Arrangement clone, Entry duplicate independence, and
  source refresh across multiple Entries with different overrides.

### Planning and Reconciliation

- No-override Session and Arrangement plans remain behaviorally equivalent to
  current playback.
- Mixed tempos across multi-Part Entries, repeated plays, duplicated captured
  Sections, inherited and overridden Entries, and loop wrap.
- Step, exercise-request, rhythm-request, first-count-in, aggregate-signature,
  and tempo-signature values.
- Session tempo changes still return `retime`; any Arrangement effective-tempo
  map change returns `stop`, including during a queued handoff.
- Arrangement base-tempo changes affect only inherited steps in the signature;
  Entry override edits and clears affect exactly their expanded steps.
- Entry-loop planning selects the requested visible Entry, uses its effective
  tempo, expands its content once regardless of `playCount`, counts in once,
  loops cleanly, and carries Arrangement ownership and Entry context.
- Full Arrangement and Entry-loop hooks reconcile against their corresponding
  active plan; neither mistakenly stops a valid Entry loop by comparing it with
  the full-Arrangement source signature.

### Coordinator and Audio Boundary

- Exact mixed-tempo occurrence offsets, active step duration, loop duration,
  skipped-handoff recovery, finite ending, and loop wrap.
- Plan-level tempo deliberately differs from step tempos without influencing
  any timing or transport call.
- During a queued mixed-tempo handoff, snapshot active tempo remains outgoing,
  pending tempo is incoming, and commit changes them atomically.
- Stop during prepare, stop during a queued handoff, and stale async completion
  cannot restart playback.
- Silent first step count-in uses the first step tempo.
- At Entry and repeated-play boundaries, outgoing lanes stop and incoming lanes
  start at the same timestamp with the incoming BPM and without Rhythm
  preservation.
- Entry-loop start replaces unrelated transport playback, wraps at exact
  mixed-tempo boundaries without another count-in, and is stopped safely by
  stale-plan, owner, tempo-map, and global Arrangement-stop paths.

### Chart and UI

- Chart cue timing accumulates mixed-tempo steps and invalidates stale timers.
- Consecutive Entries sharing a captured `sectionId` still cue and select by
  distinct `entryId`; repeated plays of one Entry remain one display run.
- The icon-only Section playback button, accessible tempo/loop status, dialog
  title, Tempo previews, initial override value, immediate edits, clearing,
  reload persistence, and independent duplicates.
- Opening, expanding, and closing the Section playback dialog do not interrupt
  playback. The first actual tempo mutation stops playback owned by that
  Arrangement before writing and never resumes it.
- `Loop This Section` replaces full-Arrangement, Session, manual, or another
  Entry-loop playback; `Stop` appears only for that exact active Entry loop; the
  Arrangement header remains a global Stop for Arrangement-owned playback.
- Arrangement-header and active-Library Arrangement tempo editors stop their
  owning Arrangement before opening; inactive Arrangement edits do not stop
  unrelated playback.
- The icon-only playback button keeps narrow/mobile Section headers tidy and
  wraps consistently with the existing action clusters.
- Duplicate and Remove remain present only in the Section header. Duplicate
  creates and selects an independent adjacent copy; Remove acts immediately
  without confirmation, stops Arrangement-owned playback first, prunes an
  unreferenced captured Section, and restores selection/focus predictably.
- The Section Playback dialog contains only the Tempo disclosure and loop
  transport plus Close; no management, source, play-count, or reorder controls
  appear inside it.

### Regression Gate

- Run formatting check, strict lint, typecheck, unit/coverage suite, audio
  verification, production build, and relevant Playwright E2E tests.
- Do not accept the feature with timing assertions weakened or converted to
  approximate ordering checks; mixed-tempo boundary tests must retain exact
  expected transport times.

## Assumptions and Exclusions

- Overrides belong to visible Arrangement Entries, not shared captured Section
  content.
- One override applies to every Part and repeated play in an Entry.
- `Loop This Section` is transient transport state, is not persisted, and loops
  one expansion of the selected Entry; the Entry's full-Arrangement `playCount`
  is ignored by the infinite loop.
- Sessions receive no per-Part tempo overrides.
- Captured Session tempo remains provenance only and is not automatically used
  for Arrangement playback.
- The Section playback dialog does not add local backing-band source settings in
  this version; it provides Tempo and the loop transport only.
- `Play Arrangement From Here` is a preferred future playback action but is not
  included in this version. Per-Entry count-in overrides, backing-band
  overrides, transposition, custom labels, notes, stop-after-Section behavior,
  and transition settings are also excluded.
- Confirmation and Undo for Arrangement Entry removal are not introduced here;
  the existing immediate quick-edit behavior is retained deliberately.
- No live Arrangement or Entry-loop tempo editing, tempo ramps, bulk editing,
  beat-unit or time-signature expansion, automatic tempo extraction, or
  Chart/Library override display is included.
