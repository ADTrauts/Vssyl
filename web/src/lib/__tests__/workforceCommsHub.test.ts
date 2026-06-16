import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('workforce comms hub rendering contracts', () => {
  it('WorkforceCommsLayout composes sidebar and content view', () => {
    const layout = readFileSync(
      join(__dirname, '../../components/workforce-comms/WorkforceCommsLayout.tsx'),
      'utf8'
    );
    expect(layout).toContain('WorkforceCommsSidebar');
    expect(layout).toContain('WorkforceCommsContentView');
    expect(layout).toContain('PendingAckBanner');
  });

  it('WorkforceCommsContentView wires feed, admin lists, and global trash', () => {
    const content = readFileSync(
      join(__dirname, '../../components/workforce-comms/WorkforceCommsContentView.tsx'),
      'utf8'
    );
    expect(content).toContain('WorkforceCommsFeed');
    expect(content).toContain('CommunicationList');
    expect(content).toContain('CampaignManager');
    expect(content).toContain('Global Trash');
  });

  it('CommunicationDetail integrates read, ack, and V-Link', () => {
    const detail = readFileSync(
      join(__dirname, '../../components/workforce-comms/CommunicationDetail.tsx'),
      'utf8'
    );
    expect(detail).toContain('markCommunicationRead');
    expect(detail).toContain('markCommunicationAcknowledged');
    expect(detail).toContain('WORKFORCE_COMMUNICATION');
    expect(detail).toContain('openConnectModal');
  });

  it('AudiencePicker consumes estimate API without local resolution', () => {
    const picker = readFileSync(
      join(__dirname, '../../components/workforce-comms/AudiencePicker.tsx'),
      'utf8'
    );
    expect(picker).toContain('estimateCommunicationAudience');
    expect(picker).not.toContain('resolveAudience');
  });

  it('GlobalTrashContext includes workforce communication and campaign types', () => {
    const trash = readFileSync(
      join(__dirname, '../../contexts/GlobalTrashContext.tsx'),
      'utf8'
    );
    expect(trash).toContain("'communication'");
    expect(trash).toContain("'campaign'");
  });
});
