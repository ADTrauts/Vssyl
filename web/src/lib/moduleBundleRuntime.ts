import { unzipSync } from 'fflate';

/** Normalize zip entry keys for lookup (forward slashes, trim). */
export function normalizeZipEntryKey(key: string): string {
  return key.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function dirname(entryPath: string): string {
  const n = normalizeZipEntryKey(entryPath);
  if (!n.includes('/')) return '';
  return n.slice(0, n.lastIndexOf('/'));
}

/** Resolve a relative reference from an HTML file's directory inside the zip. */
export function resolveZipRelative(entryPath: string, ref: string): string | null {
  const trimmed = ref.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }
  const entryDir = dirname(entryPath);
  const parts = [...entryDir.split('/').filter(Boolean)];
  for (const seg of trimmed.split('/')) {
    if (seg === '..') {
      if (!parts.length) return null;
      parts.pop();
    } else if (seg && seg !== '.') {
      parts.push(seg);
    }
  }
  return parts.join('/');
}

function guessMime(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html;charset=utf-8';
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript;charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css;charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json;charset=utf-8';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
}

/**
 * Unzip a buffer, create blob URLs for every file, rewrite the entry HTML to point at those blobs.
 * Returns the blob URL for the entry HTML and a revoke function.
 */
export function mountZipAsBlobEntryHtml(
  zipBuffer: ArrayBuffer,
  entryPath: string
): { entryBlobUrl: string; revoke: () => void } {
  const u8 = new Uint8Array(zipBuffer);
  const raw = unzipSync(u8);
  const normalizedEntry = normalizeZipEntryKey(entryPath);
  if (!normalizedEntry) {
    throw new Error('Missing entry path for bundle');
  }

  const pathToData = new Map<string, Uint8Array>();
  for (const [k, v] of Object.entries(raw)) {
    const nk = normalizeZipEntryKey(k);
    if (nk) pathToData.set(nk, v);
  }

  if (!pathToData.has(normalizedEntry)) {
    throw new Error(`Entry file not found in zip: ${normalizedEntry}`);
  }

  const createdUrls: string[] = [];
  const blobUrlByPath = new Map<string, string>();

  pathToData.forEach((data, path) => {
    const blob = new Blob([new Uint8Array(data)], { type: guessMime(path) });
    const url = URL.createObjectURL(blob);
    createdUrls.push(url);
    blobUrlByPath.set(path, url);
  });

  const entryBytes = pathToData.get(normalizedEntry);
  if (!entryBytes) {
    createdUrls.forEach((u) => URL.revokeObjectURL(u));
    throw new Error('Entry file missing after map build');
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  let html = decoder.decode(entryBytes);

  const swapQuotedUrl = (full: string, quote: string, ref: string): string => {
    const resolved = resolveZipRelative(normalizedEntry, ref);
    if (!resolved) return full;
    const blobUrl = blobUrlByPath.get(resolved);
    if (!blobUrl) return full;
    return full.replace(`${quote}${ref}${quote}`, `${quote}${blobUrl}${quote}`);
  };

  // <script ... src="...">
  html = html.replace(/<script\b[^>]*\bsrc=(["'])([^"']+)\1/gi, (full, quote: string, ref: string) =>
    swapQuotedUrl(full, quote, ref)
  );
  // <link ... href="...">
  html = html.replace(/<link\b[^>]*\bhref=(["'])([^"']+)\1/gi, (full, quote: string, ref: string) =>
    swapQuotedUrl(full, quote, ref)
  );

  const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const entryBlobUrl = URL.createObjectURL(htmlBlob);
  createdUrls.push(entryBlobUrl);

  return {
    entryBlobUrl,
    revoke: () => {
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}
