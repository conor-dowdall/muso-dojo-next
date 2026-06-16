# Audio Sample Pack Tooling

This folder contains build-time tooling for compiling a curated SoundFont 2
subset into Web Audio-friendly WAV sprites plus generated metadata.

## Quick Start

Put local source SoundFonts in either `sf2/` at the repo root or
`tools/audio/sources/`. Those paths are ignored by git.

Inspect available presets:

```sh
pnpm audio:inspect sf2/FluidR3_GM.sf2
```

Inspect raw sample headers, including pitch correction and loop offsets:

```sh
pnpm audio:inspect sf2/FluidR3_GM.sf2 --samples
```

Dry-run the example recipe without writing WAV files:

```sh
pnpm audio:build:dry
```

Build sprites and generated metadata:

```sh
pnpm audio:build
```

## Recipe Notes

`sample-packs.example.json` chooses a few root notes per pack. Each root can be
an integer MIDI note or an object:

```json
{
  "rootMidi": 60,
  "lowMidi": 57,
  "highMidi": 63,
  "sampleName": "optional sample-name filter",
  "sampleIndex": 12
}
```

When `lowMidi` and `highMidi` are omitted, the script infers split points
halfway between neighboring roots. Use explicit ranges for final curation.

The script converts SF2 sample-header loop points into sprite-buffer seconds
after resampling, so the app does not need to understand SF2 global sample
indexes.
