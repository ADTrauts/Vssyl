'use client';

import React from 'react';
import { CalendarProvider } from '../../contexts/CalendarContext';
import AIWorkspaceLanding from '../ai/AIWorkspaceLanding';
import ChatModuleWrapper from '../chat/ChatModuleWrapper';
import CalendarWorkspaceLanding from '../calendar/CalendarWorkspaceLanding';
import { NotebookShell } from '../notebook/NotebookShell';
import TodoWorkspaceLanding from '../todo/TodoWorkspaceLanding';
import PlaceWorkspaceLanding from '../place/PlaceWorkspaceLanding';
import { VLinkModule } from '../vlink/VLinkModule';
import DriveWorkspaceLanding from '../drive/DriveWorkspaceLanding';
import HRLayout from '../hr/HRLayout';
import SchedulingLayout from '../scheduling/SchedulingLayout';
import WorkforceCommsLayout from '../workforce-comms/WorkforceCommsLayout';
import BusinessWorkspaceHubPanel from './BusinessWorkspaceHubPanel';
import BusinessWorkspaceModuleRedirect from './BusinessWorkspaceModuleRedirect';
import PartnerModuleWorkspaceEmbed from '../PartnerModuleWorkspaceEmbed';
import { getModuleDefinition, normalizeModuleId } from '../../runtime/modules/moduleRegistry';
import {
  businessWorkspaceMountedModuleIds,
  normalizeWorkspaceModuleId,
} from '../../lib/businessWorkspaceContracts';

interface Business {
  id: string;
  name: string;
  logo?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customCSS?: string;
  };
}

interface BusinessWorkspaceContentProps {
  business: Business;
  currentModule: string;
  businessDashboardId: string | null;
  isBusinessAdmin?: boolean;
}

export default function BusinessWorkspaceContent({
  business,
  currentModule,
  businessDashboardId,
  isBusinessAdmin = false,
}: BusinessWorkspaceContentProps) {
  const renderModuleContent = () => {
    const _moduleContract = getModuleDefinition(normalizeModuleId(currentModule));
    void _moduleContract;

    const membersHref = `/business/${business.id}/workspace/members`;
    const analyticsHref = `/business/${business.id}/workspace/analytics`;

    switch (currentModule) {
      case 'dashboard':
        return (
          <BusinessWorkspaceHubPanel
            businessName={business.name}
            businessId={business.id}
            isAdmin={isBusinessAdmin}
          />
        );
      case 'drive':
        return (
          <DriveWorkspaceLanding
            dashboardId={businessDashboardId}
            businessId={business.id}
            className="h-full"
          />
        );
      case 'chat':
        return (
          <ChatModuleWrapper
            className="h-full"
            businessId={business.id}
            dashboardId={businessDashboardId}
          />
        );
      case 'calendar':
        return (
          <CalendarProvider>
            <CalendarWorkspaceLanding
              dashboardId={businessDashboardId}
              businessId={business.id}
            />
          </CalendarProvider>
        );
      case 'hr':
        return <HRLayout businessId={business.id} />;
      case 'scheduling':
        return <SchedulingLayout businessId={business.id} />;
      case 'workforce_comms':
      case 'workforce-comms':
        return <WorkforceCommsLayout businessId={business.id} />;
      case 'analytics':
        return <BusinessWorkspaceModuleRedirect href={analyticsHref} />;
      case 'members':
      case 'connections':
        return <BusinessWorkspaceModuleRedirect href={membersHref} />;
      case 'ai':
        return (
          <AIWorkspaceLanding
            dashboardId={businessDashboardId}
            dashboardType="business"
            dashboardName={business.name}
          />
        );
      case 'notebook':
      case 'notes':
        return (
          <NotebookShell
            dashboardId={businessDashboardId}
            businessId={business.id}
          />
        );
      case 'todo':
        return (
          <TodoWorkspaceLanding
            dashboardId={businessDashboardId}
            businessId={business.id}
          />
        );
      case 'place':
        return <PlaceWorkspaceLanding businessId={business.id} />;
      case 'vlink':
        return <VLinkModule dashboardId={businessDashboardId} />;
      default: {
        const firstPartyIds = new Set(businessWorkspaceMountedModuleIds());
        const normalized = normalizeWorkspaceModuleId(currentModule);
        if (!firstPartyIds.has(normalized)) {
          return (
            <PartnerModuleWorkspaceEmbed
              moduleId={currentModule}
              businessId={business.id}
              businessDashboardId={businessDashboardId}
              className="h-full min-h-[400px]"
            />
          );
        }
        return (
          <BusinessWorkspaceHubPanel
            businessName={business.name}
            businessId={business.id}
            isAdmin={isBusinessAdmin}
          />
        );
      }
    }
  };

  return <div className="h-full">{renderModuleContent()}</div>;
}
