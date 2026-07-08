# Music Theory Utility Notes

This folder is the local boundary around `@musodojo/music-theory-data`. Keep it
small. When a helper names a stable musical concept, prefer moving that concept
upstream and importing the package directly. When a helper combines package data
with Muso Dojo UI state, playback limits, persistence defaults, or copy, keep it
here.

Use the package facade objects first:

- `rootAndNoteCollection` for rooted note names, intervals, pitch classes,
  harmony display layers, and identity labels.
- `noteCollection` for catalog validation, display names, intervals, qualities,
  and authored harmony.
- `chordProgression` for progression validation, Roman symbols, chord
  references, bar grouping, song-order references, and total duration.

Avoid adding thin wrappers over those facade methods. The deleted
`partIdentity.ts` wrapper is the example to follow: consumers should call
`rootAndNoteCollection.getIdentity()` directly.

## Current Files

### `appChordProgressions.ts`

Status: mostly an app catalog boundary.

This currently aliases the package's built-in chord progressions and category
groups, plus normalizes app-facing progression keys. Keep it if Muso Dojo wants
an app-curated progression catalog, hidden package entries, custom entries, or a
stable persistence boundary. If the app never customizes the package catalog,
this can collapse and consumers can import `chordProgression`,
`chordProgressions`, and `chordProgressionCategoryGroups` directly.

### `chordProgressions.ts`

Status: app display composition with one upstream candidate.

This already uses `chordProgression.getChordReferencesByBar()` for chord-name
bar labels and `chordProgression.getRomanSymbols()` for Roman display labels.
The remaining local work joins labels with `DISPLAY_VALUE_SEPARATOR` and chooses
the picker title from app display metadata.

Candidate for `music-theory-data`: a duration-aware Roman-symbol helper, for
example `chordProgression.getRomanSymbolsByBar()` or a more general
duration-aware label grouper. If that lands upstream, this file can shrink to
title/copy formatting.

### `chordProgressionRhythm.ts`

Status: mixed package-derived analysis and app rhythm policy.

`chordProgression.getTotalDurationInBars()` already owns total duration. The
pure, reusable part is `getRequiredBarDivisionForDurations()`: it derives the
least subdivision needed to represent authored chord durations. That would fit
well in `music-theory-data`, either as a generic duration helper or as a
`chordProgression` helper.

Keep the current swing preference and rhythm-starter choice local for now. It
uses Muso Dojo rhythm presets, a max-beat cap, and product judgment such as
treating current 12-bar/blues/jazz material as swing.

### `collectionToneSequence.ts`

Status: strongest upstream candidate in this folder.

This turns package `noteCollections` data into a position-addressable tone
sequence for drones and exercises. It derives:

- collection tone metadata from `integers` and `intervals`
- finite voicing detection for chord collections with extensions above the
  octave
- pitch-class columns for finite voicings
- degree signatures used when preserving selections across collection changes
- repeated positions across registers, including shifted interval labels

This is reusable music-theory behavior, not inherently app UI. A good upstream
shape would be something like `noteCollection.getToneSequenceMetadata(key)` and
`noteCollection.getToneAtPosition(key, position)`. Move it once
`music-theory-data` is ready to bless these finite-voicing semantics.

### `collectionPositionIdentity.ts`

Status: probably app-specific, possible later package helper.

This preserves a selected grid/playback note when the note collection changes:
keep the same collection position for like-shaped collections, otherwise match
by interval degree. The rule is driven by Muso Dojo selection behavior and the
candidate shape from our UI/playback models.

If multiple apps need this, it could move upstream as a small
collection-position matching helper. Until then, keep it local.

### `beatSubdivision.ts`

Status: upstream candidate, with app copy split out.

The stable theory pieces are subdivision ids, count per beat, step size, note
labels, and theory labels such as straight eighths or triplets. Those would fit
well in `music-theory-data` as a rhythm or beat-subdivision catalog.

The app-facing control labels, density labels, and descriptions are product copy
used by rhythm and exercise controls. If this migrates, keep that copy local and
source only the reusable subdivision facts from the package.

## Adjacent Candidates

- `src/data/rhythmPresets.ts`
  - `getRhythmTheoryReadout()` derives meter labels and theory details such as
    `4/4`, `6/8`, `Simple Quadruple`, and `Compound Duple`.
  - This is a strong upstream candidate once the rhythm model settles. The
    general meter classification and time-signature labeling should live in
    `@musodojo/music-theory-data`; generated hit patterns and preset-specific
    product choices should remain in the app.

- `src/utils/music-part/partDuration.ts`
  - Keep local. It normalizes Practice Band/Part durations into the subset this
    app can play. The general idea of bar fractions may be reusable, but the
    current min/max beat constraints are transport policy.

- `src/utils/music-part/partLeadSheet.ts`
  - Keep local. It combines package identity labels, editable Rhythm state, and
    imported duration provenance into the app's Chart view display model. Part
    identity itself should continue to come directly from
    `rootAndNoteCollection.getIdentity()`.

## Migration Priority

1. Move `collectionToneSequence.ts` upstream when the package is ready for
   position-addressable collection tones and finite voicing metadata.
2. Move stable beat-subdivision facts and meter classification upstream as the
   rhythm package surface matures.
3. Add duration-aware Roman-symbol/bar-label helpers to `chordProgression` if
   another caller needs the same grouping.
4. Collapse `appChordProgressions.ts` only if Muso Dojo decides it does not need
   an app-curated progression catalog boundary.
