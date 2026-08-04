# Browser Integration Testing Recommendation

## Position

The remaining coverage gap should be addressed with a small browser-integration
suite, not by pursuing a higher global line-coverage percentage.

The audio code already has strong deterministic coverage in Vitest. Adding more
mock-based scheduler and coordinator cases solely to increase the overall
percentage would provide little confidence in the risks that remain. Those
risks exist at browser boundaries: user-gesture requirements, native Web Audio
state, page lifecycle, persistence, service-worker installation, Cache Storage,
and offline behavior.

My recommendation is to add Playwright now, but deliberately constrain it to
approximately four high-value Chromium tests. It should complement Vitest, not
become a second comprehensive test suite.

Do not add a global coverage gate. Keep reviewing scenario coverage and
regression value instead.

## Which test layer should own each risk?

| Risk                                                        | Primary test layer                    | Reason                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Scheduling, ownership, cancellation, and timing boundaries  | Vitest                                | Fake clocks and controlled promises are faster and more deterministic than a browser.                      |
| Generated service-worker manifest policy                    | Build-artifact assertion              | Precache contents can be checked exactly without starting a browser.                                       |
| Service-worker activation, runtime caching, and offline use | Playwright on Chromium                | These require a real service worker and Cache Storage.                                                     |
| Gesture → audio preparation → play → stop                   | Playwright on Chromium                | This crosses React events, autoplay policy, fetch, native decoding, and `AudioContext`.                    |
| Persisted state surviving reload                            | Playwright                            | This validates the real store, browser storage, lifecycle, and hydration together.                         |
| Suspended `AudioContext` recovery                           | Playwright plus existing Vitest tests | A browser can exercise the native context state while Vitest retains deterministic failure coverage.       |
| iOS interruption behavior and subjective musical feel       | Manual device check                   | Desktop automation cannot faithfully reproduce mobile audio interruption or confirm what a musician hears. |

## Recommended automated scenarios

### 1. Service-worker and audio-cache contract

Split this concern into one deterministic artifact check and one browser test.

The artifact check should run after `pnpm build` and inspect the generated
service worker. It should assert the intended policy rather than snapshotting
the entire generated file:

- the homepage, `/dojo`, offline page, manifest, and required app-shell assets
  are precached;
- audio files are not in the install-time precache;
- the audio runtime cache exists with the expected cache name;
- a regular build cannot accidentally add WAV files to the precache.

The Playwright test should use a fresh browser context and the production build:

1. Open `/dojo` and wait for the service worker to activate and control the
   page.
2. Confirm that the audio runtime cache is initially empty.
3. Trigger ordinary default-format playback through a real click.
4. Confirm that an Ogg asset is now in the audio runtime cache and no WAV asset
   was requested or cached.
5. Stop playback, switch the context offline, reload, and confirm that the app
   shell and previously used audio can still be used.

Avoid fixed sleeps. Wait for service-worker activation, browser-visible state,
network completion, or Cache Storage conditions.

Cache updating needs an explicit versioning contract before it can have a
meaningful test. A `CacheFirst` response stored under an unchanged URL is not an
update mechanism. Prefer content-addressed audio URLs generated from the asset
or provenance hash, such as `piano.<hash>.ogg`. The simpler alternative is to
increment both `/audio/vN/` and the audio cache name whenever audio bytes
change. Whichever policy is selected, add a deterministic assertion that an
audio-content change produces a new request URL or cache generation.

A full two-deployment service-worker takeover test is not necessary initially.
It adds substantial fixture complexity, and Playwright currently has
limitations around intercepting requests for an updated service-worker script.
The versioned-URL contract provides most of the valuable protection with much
less fragility.

### 2. Real gesture → play → stop

Use one representative playback path with the default Ogg pack. The action must
begin with a genuine Playwright click so the browser applies its normal user
activation rules.

Assert only durable outcomes:

- the app leaves its preparing state;
- playback is reported as active;
- the native `AudioContext` reaches `running`;
- the expected Ogg request succeeds;
- Stop returns the UI to an inactive state;
- no uncaught page error or unhandled rejection occurs.

Do not assert exact scheduler timestamps or try to prove that speakers emitted
sound. Vitest already owns exact timing. This browser test proves that the real
integration can obtain permission, fetch and decode the asset, start playback,
and stop cleanly.

Prefer accessible roles and names as selectors. Add a narrowly scoped test ID
only if there is no stable user-facing selector. Do not expose a public
test-only audio API.

### 3. Reload and persistence recovery

Change one small, unmistakable user setting or session value, wait for the
application's persistence completion signal, and reload within the same browser
context. Assert that the value is restored and the application remains usable.

This should validate the real persistence key, Zustand hydration, snapshot
normalization, and React rendering together. It should not duplicate the many
normalization permutations that belong in Vitest.

If page-lifecycle flushing is considered a separate critical contract, add it
only after the ordinary reload test is stable: make a change and navigate away
before the debounce expires, then return and verify that the `pagehide` flush
preserved it.

### 4. Native `AudioContext` suspension recovery

Start playback through a user gesture, suspend the application's real audio
context from the page, and then initiate playback again through another click.
The app should resume or recreate the context, become active, and remain
stoppable.

If the test needs access to the context, capture constructed native
`AudioContext` instances with a Playwright initialization script before the app
loads. That keeps the test seam outside production code and still uses the real
browser implementation.

Do not describe this as complete interruption coverage. Chromium suspension is
automatable; iOS/Safari interruption caused by locking the device, changing
audio routes, calls, or another application requires a short manual device
protocol. Playwright's WebKit build is useful for ordinary compatibility checks
but is not a substitute for those device lifecycle events.

## Playwright configuration

Start with `@playwright/test` and install Chromium only. Service-worker
inspection in Playwright is currently supported only for Chromium-based
browsers, so installing every browser would add weight without covering the
highest-priority scenario.

Recommended configuration:

- run against `pnpm build` followed by `pnpm start`, not the development server;
- use localhost, which browsers treat as a secure context for service workers;
- explicitly allow service workers;
- use a fresh browser context for tests that inspect storage or caches;
- use one worker in CI for reproducibility;
- use no retries locally and at most one retry in CI;
- retain a trace on the first retry or failure;
- fail on uncaught page errors and unexpected console errors;
- keep screenshots and video for failures only, if traces are insufficient.

Suggested scripts are `test:browser` for the suite and `test:browser:headed` for
local diagnosis. The production build can remain a separate prerequisite so it
is not repeated for every test invocation.

## CI placement

Run browser tests in a separate job after the existing quality job:

1. Install dependencies from the frozen lockfile.
2. Install Chromium and its system dependencies.
3. Build the production application and generated service worker.
4. Run the small Playwright suite with one worker.
5. Upload the HTML report and trace artifacts when the job fails.

Keeping this separate makes failures easier to classify and avoids slowing the
fast Vitest feedback loop. Once the tests are stable in CI, they should be a
required check. A retry that passes should still be reported as a flaky result
to investigate, not accepted as permanent noise.

## What not to add

- No global line-coverage threshold.
- No attempt to reproduce every audio coordinator scenario in Playwright.
- No large component-browser suite merely to execute currently uncovered JSX.
- No exact wall-clock or audio-scheduling assertions.
- No multi-browser matrix on every pull request at the outset.
- No claim that automated playback proves latency, mastering, balance, loop
  quality, or subjective musical feel.

Firefox and WebKit smoke coverage can be reconsidered after the Chromium suite
has demonstrated value. A short real Safari/iOS check remains more valuable for
autoplay and interruption behavior than immediately tripling the automated
browser matrix.

## Adoption order

1. Define and assert the generated service-worker and audio-versioning contract.
2. Add Playwright with the gesture → play → stop scenario.
3. Add persistence across reload.
4. Add runtime-cache/offline behavior.
5. Add native context suspension recovery.

Stop at that point and evaluate failures found, maintenance cost, and runtime.
More browser tests should be added only for demonstrated browser regressions or
new cross-boundary behavior.

## Success criteria

This work is complete when the project has a small, deterministic suite that
proves:

- a real browser can start and stop default Ogg playback from a user gesture;
- ordinary state survives reload;
- the service worker follows the intended precache and on-demand audio-cache
  policy;
- cached app/audio behavior works offline;
- playback can recover from a genuinely suspended native audio context.

These are scenario guarantees, not percentage targets. Vitest should remain the
main test suite, while Playwright covers the few risks that only a browser can
represent.

## References

- [Playwright service-worker testing](https://playwright.dev/docs/service-workers)
- [Playwright web-server configuration](https://playwright.dev/docs/test-webserver)
- [Playwright continuous integration guidance](https://playwright.dev/docs/ci)
- [Playwright best practices and traces](https://playwright.dev/docs/best-practices)
