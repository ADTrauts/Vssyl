"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getDashboards, createDashboard, getDashboard, updateDashboard } from '../../api/dashboard';
import { getHousehold } from '../../api/household';
import { createWidget, deleteWidget, updateWidget, batchUpdateWidgetPositions } from '../../api/widget';
import { Dashboard } from 'shared/types';
import { Widget } from 'shared/types/widget';
import { useHydration } from '../HydrationHandler';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useSidebarCustomization } from '../../contexts/SidebarCustomizationContext';
import { toast } from 'react-hot-toast';
import { LayoutGrid, Plus } from 'lucide-react';

import DashboardGrid from '../../components/dashboard/DashboardGrid';
import type { WidgetLayoutUpdate, WidgetGridItem } from '../../components/dashboard/DashboardGrid';
import WidgetShell from '../../components/dashboard/WidgetShell';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useDashboardGrid } from '../../hooks/useDashboardGrid';
import { useDashboardStats } from '../../hooks/useDashboardStats';

import DriveWidget from '../../components/widgets/DriveWidget';
import ChatWidget from '../../components/widgets/ChatWidget';
import CalendarWidget from '../../components/widgets/CalendarWidget';
import TodoWidget from '../../components/widgets/TodoWidget';
import NotebookWidget from '../../components/widgets/NotebookWidget';
import QuickStatsWidget from '../../components/widgets/QuickStatsWidget';
import AIWidget from '../../components/widgets/AIWidget';
import NotificationsWidget from '../../components/widgets/NotificationsWidget';
import QuickNotesWidget from '../../components/widgets/QuickNotesWidget';
import BookmarksWidget from '../../components/widgets/BookmarksWidget';
import ActivityFeedWidget from '../../components/widgets/ActivityFeedWidget';
import HRWidget from '../../components/widgets/HRWidget';
import SchedulingWidget from '../../components/widgets/SchedulingWidget';
import WidgetPicker from '../../components/dashboard/WidgetPicker';
import DashboardTemplates, { DashboardTemplate } from '../../components/dashboard/DashboardTemplates';
import DashboardBuildOutModal from '../../components/DashboardBuildOutModal';
import ModuleManagementModal from '../../components/ModuleManagementModal';
import { DashboardSkeleton } from '../../components/SkeletonComponents';
import { Modal } from 'shared/components';
import HouseholdMemberManager from '../../components/household/HouseholdMemberManager';
import { isHouseholdRosterManager } from '../../lib/householdPermissions';
import { isRegisteredWidgetType } from '../../lib/personalDashboardNavigation';
import {
  buildDashboardTabBuildOutState,
  getMainPersonalDashboardId,
  mergeSelectedModuleIds,
  resolveSelectedModuleIds,
} from '../../lib/dashboardTabModules';


interface DashboardClientProps {
  dashboardId?: string | null;
}

function getDashboardType(dashboard: Dashboard | null): 'personal' | 'business' | 'educational' | 'household' {
  if (!dashboard) return 'personal';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dashboard as any;
  if (d.business || d.businessId) return 'business';
  if (d.institution || d.institutionId) return 'educational';
  if (d.household || d.householdId) return 'household';
  return 'personal';
}

function getDashboardDisplayName(dashboard: Dashboard | null): string {
  if (!dashboard) return 'My Dashboard';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dashboard as any;
  if (d.business) return d.business.name || dashboard.name;
  if (d.institution) return d.institution.name || dashboard.name;
  if (d.household) return d.household.name || dashboard.name;
  return dashboard.name || 'My Dashboard';
}

function WidgetContentRenderer({
  widget,
  dashboardContext,
  onConfigChange,
}: {
  widget: Widget;
  dashboardContext: { dashboardId: string; dashboardType: 'personal' | 'business' | 'educational' | 'household'; dashboardName: string; businessId: string | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfigChange: (config: any) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetConfig = widget.config as any;
  const normalizedType = widget.type === 'notes' ? 'notebook' : widget.type;

  if (!isRegisteredWidgetType(normalizedType)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400 text-sm">
        Unknown widget type: {widget.type}
      </div>
    );
  }

  switch (widget.type) {
    case 'chat':
      return (
        <ChatWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'drive':
      return (
        <DriveWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'calendar':
      return (
        <CalendarWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'todo':
      return (
        <TodoWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'notebook':
    case 'notes':
      return (
        <NotebookWidget
          id={widget.id}
          dashboardId={dashboardContext.dashboardId}
          dashboardType={dashboardContext.dashboardType}
          dashboardName={dashboardContext.dashboardName}
          businessId={dashboardContext.businessId}
        />
      );
    case 'quickstats':
      return (
        <QuickStatsWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'notifications':
      return (
        <NotificationsWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'quicknotes':
      return (
        <QuickNotesWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'bookmarks':
      return (
        <BookmarksWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'activityfeed':
      return (
        <ActivityFeedWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'hr':
      return (
        <HRWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'scheduling':
      return (
        <SchedulingWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    case 'ai':
      return (
        <AIWidget
          id={widget.id}
          config={widgetConfig}
          onConfigChange={onConfigChange}
          {...dashboardContext}
        />
      );
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400 text-sm">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}


function EmptyDashboard({
  isEditMode,
  onAddWidget,
  onEnterEditMode,
  onApplyTemplate,
  dashboardType,
}: {
  isEditMode: boolean;
  onAddWidget: () => void;
  onEnterEditMode: () => void;
  onApplyTemplate: (template: DashboardTemplate) => void;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 400ms ease-out; }
      `}</style>
      
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
          <LayoutGrid className="w-12 h-12 text-blue-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Welcome to your Dashboard</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        Your dashboard is your command center. Add widgets to see quick summaries of your modules, 
        or start with a template to get up and running quickly.
      </p>

      {/* Quick start templates */}
      <div className="w-full max-w-2xl mb-8">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Quick Start with a Template</h4>
        <DashboardTemplates
          onSelectTemplate={onApplyTemplate}
          dashboardType={dashboardType}
          compact={false}
        />
      </div>

      {/* Or add manually */}
      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400 mb-4">
        <div className="w-12 h-px bg-gray-200" />
        <span>or</span>
        <div className="w-12 h-px bg-gray-200" />
      </div>

      {isEditMode ? (
        <button
          onClick={onAddWidget}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-gray-400 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Widgets Manually
        </button>
      ) : (
        <button
          onClick={onEnterEditMode}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-gray-400 rounded-lg transition-colors shadow-sm"
        >
          Start Building Manually
        </button>
      )}
    </div>
  );
}

export default function DashboardClient({ dashboardId }: DashboardClientProps) {
  const { isHydrated } = useHydration();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { trashItem } = useGlobalTrash();
  const { upsertDashboard } = useDashboard();
  const { hydrateConfig } = useSidebarCustomization();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [showBuildOutModal, setShowBuildOutModal] = useState(false);
  const [pendingDashboard, setPendingDashboard] = useState<Dashboard | null>(null);
  const [showModuleManagement, setShowModuleManagement] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showHouseholdMembersModal, setShowHouseholdMembersModal] = useState(false);
  const [householdRosterCanManage, setHouseholdRosterCanManage] = useState(false);
  const [hasShownBuildOut, setHasShownBuildOut] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dashboard-setup-completed');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const activeDashboardId = (params?.id as string) || dashboardId;

  type DashboardWithHousehold = Dashboard & {
    householdId?: string | null;
    household?: { id: string; name?: string; type?: string; isPrimary?: boolean };
  };

  const resolvedHouseholdId = useMemo(() => {
    if (!currentDashboard) return null;
    const d = currentDashboard as DashboardWithHousehold;
    if (d.household?.id) return d.household.id;
    if (typeof d.householdId === 'string' && d.householdId.length > 0) return d.householdId;
    return null;
  }, [currentDashboard]);

  useEffect(() => {
    if (!resolvedHouseholdId || !session?.accessToken) {
      setHouseholdRosterCanManage(false);
      return;
    }
    let cancelled = false;
    const uid = (session.user as { id?: string })?.id;
    if (!uid) {
      setHouseholdRosterCanManage(false);
      return;
    }
    getHousehold(session.accessToken, resolvedHouseholdId)
      .then((h) => {
        if (cancelled) return;
        const me = h.members.find((m) => m.userId === uid);
        setHouseholdRosterCanManage(isHouseholdRosterManager(me?.role));
      })
      .catch(() => {
        if (!cancelled) setHouseholdRosterCanManage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedHouseholdId, session?.accessToken, session?.user]);

  const refreshHouseholdRosterPermission = useCallback(async () => {
    if (!session?.accessToken || !resolvedHouseholdId) return;
    const uid = (session.user as { id?: string })?.id;
    if (!uid) return;
    try {
      const h = await getHousehold(session.accessToken, resolvedHouseholdId);
      const me = h.members.find((m) => m.userId === uid);
      setHouseholdRosterCanManage(isHouseholdRosterManager(me?.role));
    } catch {
      setHouseholdRosterCanManage(false);
    }
  }, [session?.accessToken, session?.user, resolvedHouseholdId]);

  const handleSavePositions = useCallback(async (positions: WidgetLayoutUpdate[]) => {
    if (!currentDashboard?.id || !session?.accessToken) return;
    try {
      await batchUpdateWidgetPositions(
        session.accessToken,
        currentDashboard.id,
        positions.map((p) => ({
          widgetId: p.widgetId,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
        }))
      );
    } catch (err) {
      console.error('Failed to save widget positions:', err);
    }
  }, [currentDashboard?.id, session?.accessToken]);

  const {
    isEditMode,
    isSaving,
    toggleEditMode,
    enterEditMode,
    handleLayoutChange,
  } = useDashboardGrid({ onSavePositions: handleSavePositions });

  const { stats, isLoading: statsLoading } = useDashboardStats({
    dashboardId: currentDashboard?.id || null,
  });

  // Persist setup-completed state
  useEffect(() => {
    if (typeof window !== 'undefined' && hasShownBuildOut.size > 0) {
      try {
        localStorage.setItem('dashboard-setup-completed', JSON.stringify(Array.from(hasShownBuildOut)));
      } catch { /* non-critical */ }
    }
  }, [hasShownBuildOut]);

  // Load dashboards
  useEffect(() => {
    if (!isHydrated) return;
    if (!session?.accessToken) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    getDashboards(session.accessToken)
      .then((allDashboards) => {
        const flattenedDashboards = [
          ...allDashboards.personal,
          ...allDashboards.business,
          ...allDashboards.educational,
          ...(allDashboards.household || []),
        ];
        setDashboards(flattenedDashboards);

        if (activeDashboardId) {
          return getDashboard(session.accessToken!, activeDashboardId);
        } else if (flattenedDashboards.length > 0) {
          router.push(`/dashboard/${flattenedDashboards[0].id}`);
          return null;
        } else {
          setCurrentDashboard(null);
          return null;
        }
      })
      .then((dashboard) => {
        if (dashboard) {
          upsertDashboard(dashboard);
          setCurrentDashboard(dashboard);
        } else if (activeDashboardId && dashboards.length > 0) {
          router.push(`/dashboard/${dashboards[0].id}`);
        }
      })
      .catch((err: unknown) => {
        console.error('DashboardClient: Error loading dashboards:', err);
        const isNotFound = err && typeof err === 'object' && 'status' in err && (err as Record<string, unknown>).status === 404;
        if (isNotFound && dashboards.length > 0) {
          router.push(`/dashboard/${dashboards[0].id}`);
        } else {
          const msg = err instanceof Error ? err.message : 'An unknown error occurred';
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [isHydrated, session?.accessToken, activeDashboardId, router, upsertDashboard]);

  // Auto-prompt build-out for empty dashboards
  useEffect(() => {
    if (!currentDashboard || loading) return;
    const isEmpty = !currentDashboard.widgets || currentDashboard.widgets.length === 0;
    const notShownYet = !hasShownBuildOut.has(currentDashboard.id);
    if (isEmpty && notShownYet && !showBuildOutModal) {
      setPendingDashboard(currentDashboard);
      setShowBuildOutModal(true);
      setHasShownBuildOut((prev) => new Set([...Array.from(prev), currentDashboard.id]));
    }
  }, [currentDashboard, loading, showBuildOutModal, hasShownBuildOut]);

  // Redirect if no dashboard selected
  useEffect(() => {
    if (!currentDashboard && !loading && dashboards.length > 0) {
      router.push(`/dashboard/${dashboards[0].id}`);
    }
  }, [currentDashboard, loading, dashboards, router]);

  const handleAddWidget = useCallback(async (type: string) => {
    if (!currentDashboard?.id || !session?.accessToken) return;
    setWidgetLoading(true);
    try {
      const widget = await createWidget(session.accessToken, currentDashboard.id, { type });
      setCurrentDashboard((prev) =>
        prev ? { ...prev, widgets: [...prev.widgets, widget] } : null
      );
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === currentDashboard.id ? { ...d, widgets: [...d.widgets, widget] } : d
        )
      );
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} widget added`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add widget';
      toast.error(msg);
    } finally {
      setWidgetLoading(false);
    }
  }, [currentDashboard?.id, session?.accessToken]);

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    if (!currentDashboard?.id || !session?.accessToken) return;
    setWidgetLoading(true);
    try {
      await deleteWidget(session.accessToken, widgetId);
      setCurrentDashboard((prev) =>
        prev ? { ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId) } : null
      );
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === currentDashboard.id
            ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) }
            : d
        )
      );
      toast.success('Widget removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove widget';
      toast.error(msg);
    } finally {
      setWidgetLoading(false);
    }
  }, [currentDashboard?.id, session?.accessToken]);

  const handleWidgetConfigChange = useCallback(async (widgetId: string, config: Record<string, unknown>) => {
    if (!session?.accessToken) return;
    try {
      await updateWidget(session.accessToken, widgetId, { config });
    } catch (err) {
      console.error('Failed to save widget config:', err);
    }
  }, [session?.accessToken]);

  const handleBuildOutComplete = useCallback(async (selectedModuleIds: string[]) => {
    if (!pendingDashboard || !session?.accessToken) return;
    setShowBuildOutModal(false);
    setHasShownBuildOut((prev) => new Set([...Array.from(prev), pendingDashboard.id]));

    const buildOutDraft = buildDashboardTabBuildOutState(pendingDashboard, selectedModuleIds);

    try {
      await updateDashboard(session.accessToken, pendingDashboard.id, {
        preferences: {
          ...(pendingDashboard.preferences && typeof pendingDashboard.preferences === 'object'
            ? pendingDashboard.preferences
            : {}),
          selectedModuleIds: buildOutDraft.normalizedSelectedModuleIds,
          sidebarCustomization: buildOutDraft.sidebarCustomization,
        },
      });

      const widgetModuleIds = buildOutDraft.normalizedSelectedModuleIds.filter(
        (id) => id !== 'dashboard'
      );
      const newWidgets =
        widgetModuleIds.length > 0
          ? await Promise.all(
              widgetModuleIds.map((moduleId) =>
                createWidget(session.accessToken!, pendingDashboard.id, { type: moduleId })
              )
            )
          : [];

      const hydrated = buildDashboardTabBuildOutState(
        pendingDashboard,
        buildOutDraft.normalizedSelectedModuleIds,
        newWidgets
      );

      upsertDashboard(hydrated.dashboard);
      hydrateConfig(hydrated.sidebarCustomization, pendingDashboard.id);

      setDashboards((prev) =>
        prev.map((d) => (d.id === pendingDashboard.id ? hydrated.dashboard : d))
      );
      if (currentDashboard?.id === pendingDashboard.id) {
        setCurrentDashboard(hydrated.dashboard);
      }

      router.push(`/dashboard/${pendingDashboard.id}`);
    } catch (err) {
      console.error('Error adding widgets to dashboard:', err);
      router.push(`/dashboard/${pendingDashboard.id}`);
    } finally {
      setPendingDashboard(null);
    }
  }, [
    pendingDashboard,
    session?.accessToken,
    router,
    currentDashboard?.id,
    upsertDashboard,
    hydrateConfig,
  ]);

  const handleBuildOutClose = useCallback(() => {
    setShowBuildOutModal(false);
    if (pendingDashboard) {
      setHasShownBuildOut((prev) => new Set([...Array.from(prev), pendingDashboard.id]));
      router.push(`/dashboard/${pendingDashboard.id}`);
      setPendingDashboard(null);
    }
  }, [pendingDashboard, router]);

  // Apply a dashboard template
  const handleApplyTemplate = useCallback(async (template: DashboardTemplate) => {
    if (!currentDashboard?.id || !session?.accessToken) return;
    setWidgetLoading(true);
    try {
      const widgetPromises = template.widgets.map((widgetType) =>
        createWidget(session.accessToken!, currentDashboard.id, { type: widgetType })
      );
      const newWidgets = await Promise.all(widgetPromises);

      const isPersonalTab = getDashboardType(currentDashboard) === 'personal';
      let mergedSelected: string[] | undefined;

      if (isPersonalTab) {
        const mainId = getMainPersonalDashboardId(dashboards);
        mergedSelected = mergeSelectedModuleIds(
          resolveSelectedModuleIds(currentDashboard, {
            isMainPersonalTab: currentDashboard.id === mainId,
            widgetTypes: currentDashboard.widgets?.map((w) => w.type),
          }),
          template.widgets
        );
        const existingPrefs =
          currentDashboard.preferences && typeof currentDashboard.preferences === 'object'
            ? currentDashboard.preferences
            : {};
        await updateDashboard(session.accessToken, currentDashboard.id, {
          preferences: {
            ...existingPrefs,
            selectedModuleIds: mergedSelected,
          },
        });
      }

      const updatedDashboard = {
        ...currentDashboard,
        widgets: [...currentDashboard.widgets, ...newWidgets],
        preferences: isPersonalTab
          ? {
              ...(currentDashboard.preferences ?? {}),
              selectedModuleIds: mergedSelected,
            }
          : currentDashboard.preferences,
      };
      setCurrentDashboard(updatedDashboard);
      setDashboards((prev) =>
        prev.map((d) => (d.id === currentDashboard.id ? updatedDashboard : d))
      );
      toast.success(`Applied "${template.name}" template`);
      enterEditMode();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply template';
      toast.error(msg);
    } finally {
      setWidgetLoading(false);
    }
  }, [currentDashboard, session?.accessToken, enterEditMode, dashboards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'e':
          // Toggle edit mode
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            toggleEditMode();
          }
          break;
        case 'escape':
          // Exit edit mode or close modals
          if (showHouseholdMembersModal) {
            setShowHouseholdMembersModal(false);
          } else if (showAddWidget) {
            setShowAddWidget(false);
          } else if (isEditMode) {
            toggleEditMode();
          }
          break;
        case 'a':
          // Open add widget picker (only in edit mode)
          if (isEditMode && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setShowAddWidget(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, showAddWidget, showHouseholdMembersModal, toggleEditMode]);

  // Dashboard context for widgets (include businessId for business dashboards)
  const dashboardContext = currentDashboard
    ? {
        dashboardId: currentDashboard.id,
        dashboardType: getDashboardType(currentDashboard),
        dashboardName: getDashboardDisplayName(currentDashboard),
        businessId: (currentDashboard as { businessId?: string })?.businessId ?? null,
      }
    : {
        dashboardId: 'personal',
        dashboardType: 'personal' as const,
        dashboardName: 'My Dashboard',
        businessId: null as string | null,
      };

  // Convert widgets to grid items
  const gridWidgets: WidgetGridItem[] = (currentDashboard?.widgets || []).map((w) => ({
    id: w.id,
    type: w.type,
    position: w.position
      ? { x: (w.position as Record<string, number>).x ?? 0, y: (w.position as Record<string, number>).y ?? 0, w: (w.position as Record<string, number>).w ?? 4, h: (w.position as Record<string, number>).h ?? 4 }
      : null,
  }));

  if (!isHydrated || loading) {
    return <DashboardSkeleton />;
  }

  if (!session?.accessToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-slate-800">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your dashboard.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-slate-800">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Something went wrong</div>
          <div className="text-gray-700 dark:text-gray-300 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email || 'there';
  const widgets = currentDashboard?.widgets || [];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-800/50">
      {/* Dashboard Header */}
      <DashboardHeader
        userName={userName}
        isEditMode={isEditMode}
        isSaving={isSaving}
        onToggleEditMode={toggleEditMode}
        onAddWidget={() => setShowAddWidget(true)}
        widgetCount={widgets.length}
        stats={stats}
        statsLoading={statsLoading}
        showManageHouseholdMembers={householdRosterCanManage && !!resolvedHouseholdId}
        onManageHouseholdMembers={() => setShowHouseholdMembersModal(true)}
      />

      {resolvedHouseholdId && (
        <Modal
          open={showHouseholdMembersModal}
          onClose={() => setShowHouseholdMembersModal(false)}
          title="Household members"
          size="xlarge"
        >
          <div className="max-h-[min(70vh,640px)] overflow-y-auto pr-1 -mr-1">
            <HouseholdMemberManager
              householdId={resolvedHouseholdId}
              onRosterChanged={refreshHouseholdRosterPermission}
            />
          </div>
        </Modal>
      )}

      {/* Widget Picker Modal */}
      <WidgetPicker
        isOpen={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        onSelect={handleAddWidget}
        existingWidgetTypes={widgets.map((w) => w.type)}
        dashboardType={dashboardContext.dashboardType}
        businessId={dashboardContext.businessId}
        selectedModuleIds={
          currentDashboard
            ? resolveSelectedModuleIds(currentDashboard, {
                widgetTypes: currentDashboard.widgets?.map((w) => w.type),
              })
            : undefined
        }
      />

      {/* Grid Content */}
      <div className="flex-1 overflow-auto px-2 sm:px-4 pb-6">
        {widgets.length === 0 ? (
          <EmptyDashboard
            isEditMode={isEditMode}
            onAddWidget={() => setShowAddWidget(true)}
            onEnterEditMode={enterEditMode}
            onApplyTemplate={handleApplyTemplate}
            dashboardType={dashboardContext.dashboardType}
          />
        ) : (
          <DashboardGrid
            widgets={gridWidgets}
            isEditMode={isEditMode}
            onLayoutChange={handleLayoutChange}
          >
            {(gridWidget) => {
              const widget = widgets.find((w) => w.id === gridWidget.id);
              if (!widget) return null;

              return (
                <WidgetShell
                  widgetId={widget.id}
                  widgetType={widget.type}
                  isEditMode={isEditMode}
                  onRemove={() => handleRemoveWidget(widget.id)}
                >
                  <WidgetContentRenderer
                    widget={widget}
                    dashboardContext={dashboardContext}
                    onConfigChange={(config) => handleWidgetConfigChange(widget.id, config)}
                  />
                </WidgetShell>
              );
            }}
          </DashboardGrid>
        )}
      </div>

      {/* Build Out Modal */}
      <DashboardBuildOutModal
        isOpen={showBuildOutModal}
        onClose={handleBuildOutClose}
        onComplete={handleBuildOutComplete}
        dashboardName={pendingDashboard?.name || 'New Dashboard'}
      />

      {/* Module Management Modal */}
      {currentDashboard && (
        <ModuleManagementModal
          isOpen={showModuleManagement}
          onClose={() => setShowModuleManagement(false)}
          dashboard={currentDashboard}
          onDashboardUpdate={(updatedDashboard) => {
            setCurrentDashboard(updatedDashboard);
            setDashboards((prev) =>
              prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
            );
          }}
        />
      )}
    </div>
  );
}
