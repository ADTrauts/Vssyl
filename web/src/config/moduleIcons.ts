import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Brain,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Folder,
  LayoutDashboard,
  Link2,
  Lock,
  MapPin,
  MessageSquare,
  Puzzle,
  Shield,
  Users,
} from 'lucide-react';

/**
 * Canonical module id → sidebar icon for dashboard shell and sidebar customizers.
 * Keep in sync when adding built-in modules to the registry.
 */
export const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  drive: Folder,
  chat: MessageSquare,
  members: Users,
  analytics: BarChart3,
  connections: Users,
  ai: Brain,
  calendar: CalendarIcon,
  todo: CheckSquare,
  notes: FileText,
  vlink: Link2,
  place: MapPin,
  hr: Shield,
  scheduling: CalendarIcon,
  admin: Lock,
  modules: Puzzle,
};
