import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Bell,
  Building2,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Filter,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Package,
  Search,
  Settings2,
  TriangleAlert,
  UserCircle,
  Users,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

/**
 * Canonical application icon registry.
 * Import icons only from this file — future screens use `AppIcons.<key>`.
 */
export const AppIcons = {
  operationsCenter: LayoutDashboard,
  todaysWork: ClipboardCheck,
  locations: Building2,
  employees: Users,
  logs: NotebookPen,
  menus: UtensilsCrossed,
  assets: Package,
  repairs: Wrench,
  review: ClipboardList,
  administration: Settings2,
  operationalMode: Filter,
  ready: CircleCheck,
  blocked: CircleAlert,
  inProgress: Clock3,
  warning: TriangleAlert,
  success: BadgeCheck,
  search: Search,
  notifications: Bell,
  user: UserCircle,
  signOut: LogOut,
  facility: Building2,
} as const satisfies Record<string, LucideIcon>;

export type AppIconKey = keyof typeof AppIcons;
