/**
 * Parse user teach text into memory fact subject/predicate (Phase 1A — personal).
 */

export type TeachClassification = 'fact' | 'preference' | 'vocabulary';

export function parseMemoryFactFromText(text: string): { subject: string; predicate: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { subject: 'User note', predicate: '' };
  }

  const meansMatch = /^(.+?)\s+means\s+(.+)$/i.exec(trimmed);
  if (meansMatch) {
    return { subject: meansMatch[1].trim(), predicate: meansMatch[2].trim() };
  }

  const isMatch = /^(.+?)\s+is\s+(.+)$/i.exec(trimmed);
  if (isMatch) {
    let left = isMatch[1].trim();
    left = left.replace(/^(my|your|the)\s+/i, '').trim() || isMatch[1].trim();
    const subject = left.charAt(0).toUpperCase() + left.slice(1);
    return { subject, predicate: isMatch[2].trim() };
  }

  return { subject: 'User note', predicate: trimmed };
}

export function storageLabelForClassification(
  classification: TeachClassification
): 'Fact' | 'Preference' | 'Vocabulary' {
  switch (classification) {
    case 'preference':
      return 'Preference';
    case 'vocabulary':
      return 'Vocabulary';
    default:
      return 'Fact';
  }
}
