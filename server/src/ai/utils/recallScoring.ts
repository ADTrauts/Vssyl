import { cosineSimilarityVectors, generateSimpleTextEmbedding } from './simpleTextEmbedding';

const STOP_WORDS = new Set([
  'about',
  'what',
  'were',
  'the',
  'that',
  'this',
  'with',
  'from',
  'have',
  'your',
  'remember',
  'last',
  'talked',
  'they',
  'want',
  'take',
  'when',
  'does',
  'would',
  'could',
  'should',
  'there',
  'here',
  'just',
  'like',
  'really',
  'very',
]);

const TRAVEL_TERMS =
  /\b(trip|travel|vacation|getaway|destination|flight|beach|weekend|charleston|savannah|cancun|domestic|international)\b/i;

/**
 * Lexical overlap between query and indexed snippet (complements bag-of-words embedding).
 */
export function keywordRecallScore(query: string, snippet: string): number {
  const tokenize = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    return new Set(words);
  };

  const qTokens = tokenize(query);
  const sTokens = tokenize(snippet);
  if (qTokens.size === 0 || sTokens.size === 0) return 0;

  let overlap = 0;
  for (const w of sTokens) {
    if (qTokens.has(w)) overlap += 1;
  }

  let score = overlap / Math.max(4, qTokens.size);

  const travelQuery = TRAVEL_TERMS.test(query);
  const travelSnippet = TRAVEL_TERMS.test(snippet);
  if (travelQuery && travelSnippet) {
    score = Math.min(1, score + 0.35);
  }

  return Math.min(1, score);
}

export function combinedRecallScore(query: string, snippet: string): number {
  const queryEmbedding = generateSimpleTextEmbedding(query);
  const snippetEmbedding = generateSimpleTextEmbedding(snippet);
  const semantic = cosineSimilarityVectors(queryEmbedding, snippetEmbedding);
  const keyword = keywordRecallScore(query, snippet);
  return Math.max(semantic, keyword * 0.92, semantic * 0.65 + keyword * 0.35);
}
