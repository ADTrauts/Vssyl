export {
  WorkspaceSplitLayout,
  WorkspaceSidebar,
  WorkspaceMain,
  WorkspaceSecondary,
  type WorkspaceSplitLayoutProps,
  type WorkspacePanelProps,
  type WorkspaceMainProps,
} from './WorkspaceSplitLayout';

export {
  PlatformShell,
  PlatformShellHeader,
  PlatformShellLeftNav,
  PlatformShellMain,
  PlatformShellRightRail,
  PLATFORM_SHELL_DEFAULTS,
  type PlatformShellMode,
  type PlatformShellProps,
  type PlatformShellDimensionVars,
  type PlatformShellHeaderProps,
  type PlatformShellLeftNavProps,
  type PlatformShellMainProps,
  type PlatformShellRightRailProps,
} from './PlatformShell';

export {
  PlatformLeftSidebar,
  type PlatformLeftSidebarProps,
} from './PlatformLeftSidebar';

export {
  PlatformRightRail,
  PlatformRightRailModuleButton,
  PlatformRightRailSpacer,
  type PlatformRightRailProps,
  type PlatformRightRailModuleButtonProps,
} from './PlatformRightRail';

export {
  PlatformHeader,
  PlatformHeaderBrand,
  PlatformHeaderTabsRegion,
  PlatformHeaderActions,
  usePlatformHeaderMobile,
  PLATFORM_HEADER_DEFAULTS,
  type PlatformHeaderMode,
  type PlatformHeaderProps,
  type PlatformHeaderBrandProps,
  type PlatformHeaderTabsRegionProps,
  type PlatformHeaderActionsProps,
} from './PlatformHeader';

export {
  usePlatformDashboardTabPalette,
  getPlatformDashboardTabStyle,
  PlatformDashboardTab,
  type PlatformTabPalette,
  type PlatformDashboardTabProps,
} from './platformHeaderTabs';

export { PageHeader, type PageHeaderProps } from './PageHeader';

export { PageToolbar, type PageToolbarProps } from './PageToolbar';

export {
  PlatformHeaderSearchAction,
  PlatformHeaderAvatarAction,
  PlatformHeaderAIAction,
  PlatformHeaderActionRow,
  computePlatformAIDropdownPosition,
  type PlatformHeaderActionVariant,
  type PlatformHeaderSearchActionProps,
  type PlatformHeaderAvatarActionProps,
  type PlatformHeaderAIActionProps,
  type PlatformHeaderActionRowProps,
} from './platformHeaderActionComponents';
