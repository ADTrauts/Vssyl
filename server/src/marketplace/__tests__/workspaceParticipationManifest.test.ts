import { describe, expect, it } from 'vitest';
import { parseWorkspaceParticipationFromManifest } from '../workspaceParticipationManifest';
import { WORKSPACE_BRIDGE_CONTRACT_VERSION } from 'vssyl-shared/types/workspace-bridge';

describe('workspaceParticipationManifest', () => {
  it('parses valid workspace participation manifest', () => {
    const { participation, errors } = parseWorkspaceParticipationFromManifest({
      capabilities: { workspace: true },
      workspaceParticipation: {
        contractVersion: WORKSPACE_BRIDGE_CONTRACT_VERSION,
        supportedContexts: ['business'],
        embedMode: 'iframe',
        lifecycleEvents: ['activate', 'deactivate'],
      },
    });
    expect(errors).toEqual([]);
    expect(participation?.embedMode).toBe('iframe');
  });

  it('rejects workspace capability without workspaceParticipation block', () => {
    const { participation, errors } = parseWorkspaceParticipationFromManifest({
      capabilities: { workspace: true },
    });
    expect(participation).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});
