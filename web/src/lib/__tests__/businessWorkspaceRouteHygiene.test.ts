import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BUSINESS_WORKSPACE_SWITCH_CONTRACTS,
  WORKSPACE_CHILD_ROUTE_SEGMENTS,
  businessWorkspaceSegmentSwitchSegments,
} from '../businessWorkspaceContracts';
import { shouldRenderWorkspaceChildren } from '../businessWorkspaceNavigation';

const BUSINESS_ID = 'biz-hygiene-test';
const WORKSPACE_APP_ROOT = join(__dirname, '../../app/business/[id]/workspace');

const NULL_DEFERRAL_MARKERS = [
  'shouldRenderWorkspaceChildren',
  'switch mount',
  'return null',
];

function segmentPagePath(segment: string): string {
  return join(WORKSPACE_APP_ROOT, segment, 'page.tsx');
}

describe('businessWorkspaceRouteHygiene', () => {
  it('segment-switch routes do not render workspace children', () => {
    for (const segment of businessWorkspaceSegmentSwitchSegments()) {
      const pathname = `/business/${BUSINESS_ID}/workspace/${segment}`;
      expect(shouldRenderWorkspaceChildren(pathname)).toBe(false);
    }
  });

  it('segment-page routes render workspace children', () => {
    for (const segment of Array.from(WORKSPACE_CHILD_ROUTE_SEGMENTS)) {
      if (segment === 'notes') continue;
      const pathname = `/business/${BUSINESS_ID}/workspace/${segment}`;
      expect(shouldRenderWorkspaceChildren(pathname)).toBe(true);
    }
  });

  it('segment-switch page.tsx files are null deferrals when present', () => {
    for (const segment of businessWorkspaceSegmentSwitchSegments()) {
      const pagePath = segmentPagePath(segment);
      if (!existsSync(pagePath)) {
        continue;
      }
      const source = readFileSync(pagePath, 'utf8');
      expect(
        NULL_DEFERRAL_MARKERS.some((marker) => source.includes(marker)),
        `${segment}/page.tsx must defer to switch (null deferral)`
      ).toBe(true);
      expect(source.includes('mock'), `${segment}/page.tsx must not contain mock UI`).toBe(false);
      expect(source.includes('BusinessAIControlCenter'), `${segment}/page.tsx must not mount alternate AI UI`).toBe(
        false
      );
      expect(source.includes('?module='), `${segment}/page.tsx must not use legacy query redirect`).toBe(false);
    }
  });

  it('every segment-switch contract has a switch case', () => {
    const switchPath = join(__dirname, '../../components/business/BusinessWorkspaceContent.tsx');
    const content = readFileSync(switchPath, 'utf8');
    for (const contract of BUSINESS_WORKSPACE_SWITCH_CONTRACTS) {
      if (contract.routeKind !== 'segment-switch') continue;
      const escaped = contract.moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(content, `missing switch case for ${contract.moduleId}`).toMatch(
        new RegExp(`case '${escaped}'`)
      );
    }
  });
});
