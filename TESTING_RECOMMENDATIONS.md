# Testing Recommendations

This document is a risk-based roadmap for extending the automated test suite. It is based on the coverage report and test inventory captured on 10 August 2026.

## Current baseline

The unit suite currently contains 106 files and 744 tests. The Playwright suite contains 32 tests across 12 specifications.

| Metric     | Vitest coverage |
| ---------- | --------------: |
| Statements |          57.26% |
| Branches   |          53.77% |
| Functions  |          54.09% |
| Lines      |          57.85% |

Coverage is uneven by design and by testability:

- Core utilities, data modules, stores, persistence, and much of the audio engine are comparatively well covered.
- React components and orchestration hooks have the largest direct-test gaps. Component line coverage is about 22%, while hook line coverage is about 29%.
- Playwright exercises some code reported as uncovered by Vitest, so the Vitest percentage should not be interpreted as the complete product coverage picture.
- Browser coverage is currently Chromium-focused, with limited mobile and PWA scenarios.

The goal should be to reduce product risk and make regressions easy to diagnose, not to maximize a single aggregate percentage.

## Recommended priorities

### P0: Protect instrument interaction and playback orchestration

These tests should come first because the code combines UI state, persisted state, pointer or keyboard input, and asynchronous audio behavior.

#### `useInstrumentNotes`

Add direct hook tests for:

- successful note start and stop, including the visual active-note state;
- audio engine readiness before playback begins;
- playback failures without leaving a note visually active;
- cancellation and stale asynchronous requests when a newer interaction supersedes an older one;
- note identity across octave, source key, and instrument configuration changes;
- edit-mode scope wiring versus play-mode behavior;
- locked-state snapshots and reconciliation when the displayed collection changes;
- cleanup of playing notes and subscriptions on unmount.

#### `useActiveNotes`

Add direct hook tests for:

- controlled and uncontrolled operation;
- prop and dependency changes after initial render;
- locking and unlocking while temporary notes are active;
- reconciling transient played notes with notes in the displayed collection;
- clearing persistence only when state actually changes;
- simultaneous notes and out-of-order release events.

#### Keyboard, Fretboard, and shared Instrument behavior

Keep the existing utility and navigation coverage, then add integration tests proving that:

- a displayed note configured as small or hidden becomes visibly large while played and returns to its configured size on release;
- a note outside the displayed collection follows the same press-and-release lifecycle;
- mouse, touch/pointer, and computer-keyboard input produce equivalent state transitions;
- dragging between notes releases the previous note and activates the next note exactly once;
- multi-touch or overlapping pointer input does not prematurely stop a note still held by another input;
- disabled, editing, and locked states neither play nor mutate notes unexpectedly;
- focus and keyboard navigation remain valid when geometry, range, tuning, or layout changes.

Prefer behavior assertions—accessible state, computed classes/styles, callbacks, and audio calls—over broad snapshots.

### P0: Add a DOM-capable unit-test project

The current Vitest environment is optimized for pure logic. Add a separate DOM-capable Vitest project for hooks and selected React components, using `jsdom` or `happy-dom` with React Testing Library and `user-event`.

Keep pure utilities and reducers in the existing Node environment. The DOM project should be reserved for behavior that benefits from rendering, effects, focus, pointer events, or cleanup semantics. This separation keeps fast tests fast and prevents browser emulation from leaking into domain tests.

Initial candidates are:

- `useInstrumentNotes`;
- `useActiveNotes`;
- `useControllableState`;
- Keyboard and Fretboard note/cell components;
- shared Instrument controls and header actions.

### P1: Cover untested audio-facing hooks

The audio engine itself has useful coverage, but several UI-facing audio hooks have little or none. Test the boundary between UI state and engine commands for:

- arrangement transport and chart cues;
- rhythm playback;
- drone note playback;
- rapid start/stop and repeated-trigger behavior;
- tempo or configuration changes during playback;
- engine rejection, unavailable audio, and cleanup on navigation or unmount.

Use a small contract-style fake for the audio engine. Assertions should focus on commands, ordering, cancellation, and user-visible state rather than implementation details inside the engine.

### P1: Add focused component tests

Test shared and high-branching components where a failure would affect several workflows:

- Instrument header actions: mode changes, lock/reset actions, disabled states, labels, and menus;
- Instrument note/cell rendering: active, selected, hidden, small, disabled, and focused states;
- Keyboard and Fretboard layer wiring: geometry-to-note mapping and event propagation;
- shared Button, Dialog, object menu, and range-slider behavior;
- `resolveNoteColors`, especially fallback colors, contrast choices, active state, and missing configuration.

Avoid testing every presentational wrapper. Target components with branching behavior, accessibility semantics, or reuse across features.

### P1: Expand end-to-end feature journeys

Add Playwright journeys for product areas that currently have little or no end-to-end coverage.

| Feature         | Recommended journey                                                                         |
| --------------- | ------------------------------------------------------------------------------------------- |
| Drone           | Create, configure, play, change octave, stop, reload, and verify persistence                |
| Exercise Looper | Create, configure, start with count-in, stop, edit, reload, and resume                      |
| Rhythm          | Create, set tempo/grouping, start, change configuration, stop, and reload                   |
| Arrangement     | Build a non-empty arrangement, reorder/edit sections, play through a transition, and reload |
| Fretboard       | Create, change tuning/range/appearance, play notes, clone/remove, and verify persistence    |

For audio journeys, assert observable transport state and captured audio events. Do not rely on whether the CI machine emits audible sound.

### P1: Accessibility regression coverage

Add automated accessibility checks to a small set of representative screens and dialogs, supplemented by explicit interaction tests for:

- keyboard-only creation, editing, playback, and dialog dismissal;
- unique accessible names for repeated instrument notes and controls;
- roving `tabindex` and predictable focus movement;
- focus restoration after menus and dialogs close;
- live-region announcements for playback or state changes where applicable;
- correct disabled semantics;
- hidden visual notes remaining discoverable only when that is intentional.

Automated scans are a baseline, not a substitute for testing keyboard behavior and focus order.

### P2: Cross-browser, responsive, and PWA confidence

Add a small smoke suite for WebKit and, if CI capacity permits, Firefox. It should cover the areas most likely to differ between engines:

- dialog focus and dismissal;
- pointer and keyboard instrument interaction;
- responsive instrument layout and container queries;
- range inputs and scrolling/overflow;
- audio initialization and user-gesture requirements.

Expand responsive checks beyond one mobile scenario to include a narrow phone, a tablet-sized viewport, and orientation changes. Verify that note controls remain reachable and that menus and dialogs do not overflow.

Extend PWA coverage to include:

- first load followed by offline reload;
- cache invalidation after an application update;
- unavailable or partially cached audio packs;
- recovery when connectivity returns;
- preservation of authored content across an update.

## Coverage governance

### Establish a ratchet

Add global Vitest thresholds near the current baseline so coverage cannot decline silently. Raise them only after the new tests land. A practical sequence is:

1. Record current floors for statements, branches, functions, and lines, allowing a small margin for platform rounding.
2. Add P0 hook and instrument tests.
3. Raise the global line target toward 65% and branch target toward 60%.
4. Add per-directory expectations for mature domain code instead of forcing every UI file to meet the same number.
5. Continue raising thresholds in small increments as each risk area gains meaningful tests.

Do not let a global threshold encourage low-value render snapshots. A changed-file coverage check can complement the global ratchet by requiring new or substantially changed behavior to arrive with tests.

### Report test layers separately

Track at least these signals in CI:

- Vitest coverage for pure logic, hooks, and component tests;
- Playwright scenario results by browser/project;
- accessibility scan results;
- flaky-test retries and quarantined tests.

This makes gaps visible without pretending that a line reached through Playwright and a branch asserted in a unit test provide identical confidence.

## Suggested implementation phases

### Phase 1: Test infrastructure and instrument hooks

- Add the DOM-capable Vitest project and shared render helpers.
- Cover `useInstrumentNotes`, `useActiveNotes`, and `useControllableState`.
- Add Keyboard/Fretboard integration cases for visual press state, overlapping input, and cleanup.
- Introduce baseline coverage thresholds.

### Phase 2: Audio feature journeys and shared UI

- Cover audio-facing hooks with engine contract fakes.
- Add Drone, Rhythm, Exercise Looper, and non-empty Arrangement journeys.
- Test the most reused interactive UI components.
- Add accessibility scans and keyboard-only flows.

### Phase 3: Platform confidence

- Add a small WebKit/Firefox smoke matrix.
- Expand viewport and orientation coverage.
- Test offline/update recovery and audio-pack caching.
- Raise coverage thresholds based on the achieved baseline.

## Definition of done for new behavior

A feature or bug fix should normally include:

- a focused unit test for pure state or transformation logic;
- a hook or component test for relevant effects and user-visible state;
- an end-to-end test only when the risk crosses important browser, persistence, routing, or audio boundaries;
- accessibility assertions for new interactive controls;
- regression assertions that fail for the original defect;
- cleanup checks for timers, subscriptions, pointers, and playing audio;
- no unexplained console errors, unhandled promises, or test retries.

## Tests to avoid

- large component snapshots that change for unrelated markup edits;
- tests that duplicate TypeScript's static guarantees;
- assertions against private implementation state when public behavior is observable;
- exhaustive browser duplication of logic already proven at a lower layer;
- timing-dependent audio assertions using arbitrary sleeps;
- coverage-only tests that execute a branch without checking its outcome.

The best next investment is Phase 1. It directly protects the interaction model that produced the recent note-size regression and creates the infrastructure needed to test the rest of the component layer efficiently.
