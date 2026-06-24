/** Shared relevance scoring for federated search providers. */
export function calculateRelevanceScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 1.0;
  if (lowerText.startsWith(lowerQuery)) return 0.9;
  if (lowerText.includes(lowerQuery)) return 0.7;

  const queryWords = lowerQuery.split(' ');
  const textWords = lowerText.split(' ');
  const matchingWords = queryWords.filter((word) =>
    textWords.some((textWord) => textWord.includes(word))
  );

  if (matchingWords.length > 0) {
    return 0.5 * (matchingWords.length / queryWords.length);
  }

  return 0.1;
}
