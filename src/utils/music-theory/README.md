# Potential `music-theory-data` Additions

- **Position-addressable note-collection tones**: derive finite chord voicings,
  pitch-class columns, interval identities, and repeated tones across registers.
  Possible APIs: `noteCollection.getToneSequenceMetadata()` and
  `noteCollection.getToneAtPosition()`.
- **Beat-subdivision catalog**: provide stable subdivision identities, steps per
  beat, note values, and theory labels for straight, triplet, swing, and shuffle
  subdivisions.
- **Meter analysis**: derive time-signature labels and classifications such as
  simple quadruple or compound duple from meter structure.
