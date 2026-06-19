export interface CollectionPositionIdentity {
  collectionDegreeSignature?: string;
  collectionPosition: number;
  collectionSize: number;
  intervalDegree?: number;
}

/**
 * Preserve the grid slot while comparing like with like, such as seven-note
 * modes or altered triads. When the collection's degree pattern changes,
 * preserve the musical degree instead, so a triad's 1-3-5 maps to a scale's
 * 1-3-5 rather than 1-2-3.
 */
export function resolveCollectionPositionMatch<
  T extends CollectionPositionIdentity,
>({
  candidates,
  identity,
}: {
  candidates: readonly T[];
  identity: CollectionPositionIdentity;
}) {
  const nextCollectionSize = candidates[0]?.collectionSize;
  const nextCollectionDegreeSignature =
    candidates[0]?.collectionDegreeSignature;
  const hasDegreeSignatures =
    identity.collectionDegreeSignature !== undefined &&
    nextCollectionDegreeSignature !== undefined;
  const preservesCollectionPosition = hasDegreeSignatures
    ? nextCollectionDegreeSignature === identity.collectionDegreeSignature
    : nextCollectionSize === identity.collectionSize;

  if (preservesCollectionPosition) {
    return candidates.find(
      (candidate) =>
        candidate.collectionPosition === identity.collectionPosition,
    );
  }

  if (identity.intervalDegree === undefined) {
    return undefined;
  }

  return candidates.find(
    (candidate) => candidate.intervalDegree === identity.intervalDegree,
  );
}
