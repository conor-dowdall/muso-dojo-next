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

Muso Dojo is a mature version 1 application, actively developed and maintained
as a solo project. Issues, feature suggestions, and feedback from real musical
or educational use are welcome. External pull requests are not currently being
accepted.

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

Run the same quality baseline used by GitHub Actions with:

```sh
pnpm check:ci
```

This checks formatting, strict linting, TypeScript, Vitest coverage, generated
audio provenance, and the production and service-worker builds.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution policy and
guidance on useful bug reports and feature suggestions.

## License and Attribution

Muso Dojo is licensed under
[AGPL-3.0-only](https://spdx.org/licenses/AGPL-3.0-only.html). See
[LICENSE](LICENSE) for the full license text and [NOTICE.md](NOTICE.md) for
third-party software and audio-sample notices.
