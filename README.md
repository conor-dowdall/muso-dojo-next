# Muso Dojo

Muso Dojo is a free, browser-based collection of interactive music tools for
musicians, teachers, and students. It provides hands-on ways to explore notes,
instruments, harmony, rhythm, and musical patterns.

[Open Muso Dojo](https://musodojo.vercel.app/)

## What It Includes

- Interactive fretboards and keyboards with configurable layouts, tunings,
  note labels, colors, and emphasis
- Rhythms, drones, exercise loopers, and sampled instrument playback
- Chord progressions, music parts, practice sessions, and arrangements
- Local workspace persistence and installable, offline-capable PWA behavior

## Project Status

Muso Dojo is a fully functional application that provides useful tools for
everyday musical practice and education. Future updates will be made when they
are useful and practical, without a fixed development or release schedule.

Bug reports, feature suggestions, and feedback are welcome. Anyone interested
in contributing code is invited to open an issue first so the idea, scope, and
contribution process can be discussed before implementation begins.

## Running Locally

The supported Node.js version is declared in `.nvmrc` and `package.json`; the
exact pnpm version is pinned in the `packageManager` field. Python is pinned in
`.python-version` for audio verification and sample-pack tooling.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Audio Assets

Normal playback uses Ogg Vorbis sample packs. WAV versions are retained in the
repository as reference and compatibility assets, but are not requested or
cached during a regular session. They are selected only when the app is opened
with `?audioFormat=wav`.

Their presence under `public/audio/` does not make them part of the normal
browser download path. See the [audio tooling guide](tools/audio/README.md) for
sample-pack generation, format selection, attribution, and provenance details.

## Quality Checks

The GitHub Actions quality gate has two layers: code and production-build
checks, followed by browser acceptance tests.

### Code and build checks

Run the complete non-browser baseline with:

```sh
pnpm check:ci
```

This checks formatting, strict linting, TypeScript, Vitest coverage thresholds,
audio sample integrity and provenance, and the production and service-worker
builds. During development, the narrower commands are useful for faster
feedback:

```sh
pnpm check          # Lint and TypeScript
pnpm test           # Vitest suite
pnpm test:coverage  # Vitest suite with coverage thresholds
pnpm test:watch     # Interactive Vitest watch mode
```

### Browser acceptance tests

The browser acceptance suite covers the small set of behaviors that require a
real browser: hydration and persistence, a complete authoring journey, native
dialog and input behavior, sampled-audio readiness, and PWA offline support.

Install the pinned Playwright browser builds once, then run the complete
matrix:

```sh
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

The matrix is divided by responsibility:

| Project           | Coverage                                           |
| ----------------- | -------------------------------------------------- |
| `chromium`        | Core desktop journeys                              |
| `firefox`         | Core desktop journeys in Firefox                   |
| `webkit`          | Core desktop journeys in Playwright WebKit         |
| `mobile-chromium` | Touch interaction and phone layout                 |
| `audio-chromium`  | Real sampled-audio readiness and playback feedback |
| `pwa-chromium`    | Service-worker installation and offline behavior   |

Run one project while investigating a browser-specific failure:

```sh
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
pnpm exec playwright test --project=audio-chromium
```

Playwright WebKit provides WebKit engine coverage but is not branded Safari.
Actual Safari and installed iOS Home Screen behavior require a macOS or iOS
Safari test environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution policy and
guidance on useful bug reports and feature suggestions.

## License and Attribution

Muso Dojo is licensed under
[AGPL-3.0-only](https://spdx.org/licenses/AGPL-3.0-only.html). See
[LICENSE](LICENSE) for the full license text and [NOTICE.md](NOTICE.md) for
third-party software and audio-sample notices.
