# Music Theory Utility Notes

This folder holds local helpers that sit close to `@musodojo/music-theory-data`.
When a helper describes a stable musical concept rather than Muso Dojo UI state,
prefer keeping it pure and covered by focused tests so it can move upstream.

## Upstream Candidates

- `partIdentity.ts`
  - Formats a root plus note collection as a musician-facing identity.
  - Chord collections use compact chord-symbol spacing, for example `CM7`.
  - Scale and mode collections keep a readable space, for example `C Dorian`.

- `midiNote.ts`
  - Converts MIDI note numbers to octave numbers.
  - Formats MIDI note labels such as `Bb3`.

- `src/data/rhythmPresets.ts`
  - `getRhythmTheoryReadout()` derives meter labels and theory details such as
    `4/4`, `6/8`, `Simple Quadruple`, and `Compound Duple`.
  - This currently lives beside rhythm-generation data because the app is still
    exploring the rhythm model. If it settles, the meter classification and
    time-signature labeling logic should move to `@musodojo/music-theory-data`.

## Keep App-Specific

- `src/utils/music-part/partDuration.ts`
  - Normalizes Practice Band/Part durations into the subset this app can play.
  - The general idea of bar fractions may be reusable, but the current min/max
    beat constraints are app transport policy.

- `src/utils/music-part/partLeadSheet.ts`
  - Combines Part identity, editable Rhythm state, and imported duration
    provenance into the app's Chart view display model.
