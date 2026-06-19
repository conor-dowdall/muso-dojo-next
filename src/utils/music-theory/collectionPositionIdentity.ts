export interface CollectionPositionIdentity {
  collectionPosition: number;
  collectionSize: number;
  intervalDegree?: number;
}

/**
 * Preserve the grid slot while comparing like with like, such as seven-note
 * modes. When the collection size changes, preserve the musical degree
 * instead, so a triad's 1-3-5 maps to a scale's 1-3-5 rather than 1-2-3.
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

  if (nextCollectionSize === identity.collectionSize) {
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
