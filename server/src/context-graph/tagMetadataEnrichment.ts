import type { AdapterContext, EntityRef } from './contextGraphTypes.js';
import { getTagProviderForEntity } from './tagProviderRegistry.js';

/** Attach module-owned tags to node metadata (metadata only — not graph nodes). */
export async function enrichNodeMetadataWithTags(
  ctx: AdapterContext,
  ref: EntityRef,
  metadata: Record<string, unknown> | undefined
): Promise<Record<string, unknown>> {
  const provider = getTagProviderForEntity(ref.moduleId, ref.entityType);
  if (!provider) return metadata ?? {};

  const descriptors = await provider.getTagsForEntity(ctx, ref);
  const tags = descriptors.map((d) => d.tagLabel);
  return {
    ...(metadata ?? {}),
    tags,
  };
}
