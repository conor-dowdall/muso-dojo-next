# Audio Sample Pack Tooling

This folder contains build-time tooling for compiling a curated SoundFont 2
subset into Web Audio-friendly sprite files plus generated metadata.

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

Build sprites and generated metadata. The default recipe writes both WAV and
Ogg Vorbis sprites, and uses Ogg as the normal runtime URL. WAV files remain
available as local reference assets and manual browser audition targets:

```sh
pnpm audio:build
```

To audition a specific format in the browser after building, open the app with
`?audioFormat=ogg` or `?audioFormat=wav`, for example `/dojo?audioFormat=wav`.
Without a query parameter, the app uses the recipe's preferred format.

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

Percussion packs use `keys` instead of pitched `roots`; each key extracts one
exact MIDI drum sound and emits `lowMidi = highMidi = midi` in the manifest.

The script converts SF2 sample-header loop points into sprite-buffer seconds
after resampling, so the app does not need to understand SF2 global sample
indexes.

Change `preferredDeliveryFormat` in the recipe and rebuild if the default
delivery format needs to change. Keep `deliveryFormats` as `["wav", "ogg"]`
while WAV reference files are useful for audio comparisons.
