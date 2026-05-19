/**
 * Lightweight lexical embedding for recall (no external API).
 * Shared by SemanticSimilarityEngine and AIMessage recall index.
 */

const VOCABULARY = [
  'schedule', 'meeting', 'calendar', 'time', 'date',
  'message', 'email', 'send', 'communication', 'contact',
  'file', 'document', 'organize', 'folder', 'storage',
  'task', 'todo', 'remind', 'complete', 'deadline',
  'analyze', 'report', 'summary', 'data', 'insights',
  'create', 'update', 'delete', 'modify', 'change',
  'help', 'assist', 'support', 'guide', 'explain',
  'find', 'search', 'locate', 'discover', 'identify',
  'work', 'business', 'project', 'team', 'collaboration',
  'personal', 'private', 'individual', 'self', 'own',
  'trip', 'travel', 'vacation', 'flight', 'destination',
];

export function generateSimpleTextEmbedding(text: string): number[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const embedding = new Array(VOCABULARY.length).fill(0);

  for (const word of words) {
    const index = VOCABULARY.indexOf(word);
    if (index !== -1) {
      embedding[index] += 1;
    }
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

export function cosineSimilarityVectors(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}
