/**
 * Phase 8 — Structured output validation (model output untrusted until validated).
 */
export function validateSkillOutput(
  output: Record<string, unknown>,
  schema: Record<string, unknown>
): { ok: true } | { ok: false; error: string } {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { ok: false, error: 'Output must be an object' };
  }
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  for (const key of required) {
    if (output[key] === undefined) {
      return { ok: false, error: `Missing required output field: ${key}` };
    }
  }
  if (schema.additionalProperties === false) {
    const properties =
      schema.properties && typeof schema.properties === 'object'
        ? (schema.properties as Record<string, unknown>)
        : {};
    for (const key of Object.keys(output)) {
      if (!(key in properties)) {
        return { ok: false, error: `Unsupported output field: ${key}` };
      }
    }
  }
  return { ok: true };
}

/** Reject outputs that look like they leaked secrets. */
export function detectSecretLeak(output: Record<string, unknown>): boolean {
  const text = JSON.stringify(output);
  return /sk-[a-zA-Z0-9]{20,}|OPENAI_API_KEY|BEGIN (RSA |OPENSSH )?PRIVATE KEY/.test(text);
}
