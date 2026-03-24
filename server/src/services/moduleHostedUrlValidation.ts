/**
 * Pure validation for module manifest `frontend.entryUrl` (hosted iframe entry).
 * Used by ModuleSecurityService and unit-tested independently.
 */
export interface HostedUrlValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const EMPTY_ENTRY_WARNING =
  'No hosted frontend.entryUrl provided. For iframe runtime you must add an HTTPS entry URL before approval, or upload a zip artifact after submit (recommended pipeline).';

export function validateModuleHostedUrl(manifest: Record<string, unknown> | undefined): HostedUrlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const frontend = manifest?.frontend as Record<string, unknown> | undefined;
    const entryUrlRaw = frontend?.entryUrl;
    const entryUrl = typeof entryUrlRaw === 'string' ? entryUrlRaw.trim() : '';

    if (!entryUrl) {
      warnings.push(EMPTY_ENTRY_WARNING);
      return { isValid: true, errors, warnings };
    }

    const parsed = new URL(entryUrl);

    if (parsed.protocol !== 'https:') {
      errors.push('frontend.entryUrl must use HTTPS');
    }

    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (isLocalhost) {
      warnings.push('Localhost URLs are only allowed for development');
    }

    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link'];
    if (suspiciousDomains.some(domain => parsed.hostname.includes(domain))) {
      warnings.push('URL shortening services are not recommended');
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch {
    errors.push('Invalid frontend.entryUrl format');
    return { isValid: false, errors, warnings };
  }
}
