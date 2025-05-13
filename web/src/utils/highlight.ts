interface HighlightOptions {
  caseSensitive?: boolean;
  className?: string;
  tag?: string;
}

export function highlightText(
  text: string,
  searchTerm: string,
  options: HighlightOptions = {}
): string {
  const {
    caseSensitive = false,
    className = 'bg-yellow-200',
    tag = 'mark'
  } = options;

  if (!searchTerm.trim()) {
    return text;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(searchTerm, flags);

  return text.replace(regex, (match) => {
    return `<${tag} class="${className}">${match}</${tag}>`;
  });
}

export function highlightMatches(
  text: string,
  searchTerms: string[],
  options: HighlightOptions = {}
): string {
  if (!searchTerms.length) {
    return text;
  }

  let highlightedText = text;
  for (const term of searchTerms) {
    highlightedText = highlightText(highlightedText, term, options);
  }
  return highlightedText;
}

export function extractSnippet(
  text: string,
  searchTerm: string,
  contextLength: number = 100
): string {
  if (!text || !searchTerm) {
    return text;
  }

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) {
    return text.slice(0, contextLength) + '...';
  }

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + searchTerm.length + contextLength / 2);

  let snippet = text.slice(start, end);
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < text.length) {
    snippet = snippet + '...';
  }

  return snippet;
} 