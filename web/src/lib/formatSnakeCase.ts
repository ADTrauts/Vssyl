/** Human-readable label from snake_case API values; safe when field is missing. */
export function formatSnakeCase(value?: string | null, fallback = 'unknown'): string {
  if (value == null || value === '') {
    return fallback.replace(/_/g, ' ');
  }
  return value.replace(/_/g, ' ');
}
