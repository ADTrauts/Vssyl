import { describe, expect, it } from 'vitest';
import {
  canRenderModuleWithPermissions,
  canRenderWidgetWithPermissions,
  deriveAvailableWidgets,
} from '../workspace/workspaceRuntimeHelpers';

describe('workspaceRuntimeHelpers', () => {
  it('filters widgets by personal context', () => {
    const widgets = deriveAvailableWidgets('personal', ['drive', 'chat']);
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain('drive');
    expect(ids).toContain('chat');
    expect(ids).not.toContain('hr');
  });

  it('includes business widgets when installed on business context', () => {
    const widgets = deriveAvailableWidgets('business', ['hr', 'drive']);
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain('hr');
    expect(ids).toContain('drive');
  });

  it('allows module when permission snapshot is undefined (placeholder)', () => {
    expect(canRenderModuleWithPermissions('drive', 'personal', undefined, ['drive'])).toBe(
      true
    );
  });

  it('denies module when snapshot lacks required view permission', () => {
    expect(
      canRenderModuleWithPermissions('drive', 'personal', { drive: [] }, ['drive'])
    ).toBe(false);
  });

  it('allows module when snapshot grants view', () => {
    expect(
      canRenderModuleWithPermissions('drive', 'personal', { drive: ['view'] }, ['drive'])
    ).toBe(true);
  });

  it('allows always-available widget without install', () => {
    expect(
      canRenderWidgetWithPermissions('notifications', 'personal', undefined, [])
    ).toBe(true);
  });

  it('denies unknown widget', () => {
    expect(
      canRenderWidgetWithPermissions('nonexistent-widget', 'personal', undefined, [])
    ).toBe(false);
  });
});
