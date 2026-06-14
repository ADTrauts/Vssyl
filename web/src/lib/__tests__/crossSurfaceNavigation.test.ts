import { describe, expect, it } from 'vitest';
import {
  buildBusinessToPersonalHref,
  buildBusinessToPlaceHref,
  buildMembersNavigationHref,
  buildModuleToDashboardReturnHref,
  buildPersonalDashboardSwitchHref,
  buildPersonalToBusinessHref,
  buildPersonalToPlaceHref,
  buildWidgetToModuleHref,
} from '../crossSurfaceNavigation';

const DASHBOARD_ID = 'dash-xws-001';
const BUSINESS_ID = 'biz-xws-001';

describe('crossSurfaceNavigation', () => {
  it('personal to business uses segment workspace URLs', () => {
    expect(buildPersonalToBusinessHref(BUSINESS_ID)).toBe(`/business/${BUSINESS_ID}/workspace`);
    expect(buildPersonalToBusinessHref(BUSINESS_ID, 'drive')).toBe(
      `/business/${BUSINESS_ID}/workspace/drive`
    );
  });

  it('business to personal returns dashboard grid', () => {
    expect(buildBusinessToPersonalHref(DASHBOARD_ID)).toBe(`/dashboard/${DASHBOARD_ID}`);
    expect(buildBusinessToPersonalHref()).toBe('/dashboard');
  });

  it('place transitions', () => {
    expect(buildPersonalToPlaceHref()).toBe('/place');
    expect(buildBusinessToPlaceHref(BUSINESS_ID, 'publisher')).toBe(
      `/business/${BUSINESS_ID}/workspace/place`
    );
    expect(buildBusinessToPlaceHref(BUSINESS_ID, 'consumer')).toBe('/place');
  });

  it('widget to module and return', () => {
    expect(buildWidgetToModuleHref('todo', DASHBOARD_ID)).toBe(`/todo?dashboard=${DASHBOARD_ID}`);
    expect(buildModuleToDashboardReturnHref(DASHBOARD_ID)).toBe(`/dashboard/${DASHBOARD_ID}`);
  });

  it('members routing branches by context', () => {
    expect(buildMembersNavigationHref({ personal: true })).toBe('/member');
    expect(buildMembersNavigationHref({ businessId: BUSINESS_ID })).toBe(
      `/business/${BUSINESS_ID}/workspace/members`
    );
  });

  it('dashboard switch preserves module', () => {
    expect(buildPersonalDashboardSwitchHref(DASHBOARD_ID, 'drive')).toBe(
      `/drive?dashboard=${DASHBOARD_ID}`
    );
    expect(buildPersonalDashboardSwitchHref(DASHBOARD_ID, 'dashboard')).toBe(
      `/dashboard/${DASHBOARD_ID}`
    );
  });
});
