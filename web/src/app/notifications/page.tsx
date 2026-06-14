'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Bell, 
  Settings, 
  Check, 
  Archive,
  MoreHorizontal,
  MessageSquare,
  Folder,
  FileText,
  Users,
  Building,
  AlertCircle,
  AtSign,
  Clock,
  Search,
  ChevronRight,
  UserCheck,
  List,
  Layers,
  Zap,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Avatar, Button, Badge, ConfirmModal, DropdownMenu, ContextMenuItem } from 'shared/components';
import { PageHeader, PageToolbar } from '../../components/layouts';
import { useSafeSession } from '../../lib/useSafeSession';
import { useRouter } from 'next/navigation';
import { getNotifications, markAsRead, markAllAsRead, getModuleNotificationTypes, archiveNotification, archiveMultipleNotifications, deleteNotification, deleteMultipleNotifications, getGroupedNotifications, markGroupAsRead, snoozeNotification, unsnoozeNotification, type Notification, type NotificationGroup } from '../../api/notifications';
import { useNotificationSocket } from '../../lib/notificationSocket';
import type { ModuleNotificationMetadata, ModuleNotificationType } from 'shared/types/module-notifications';

interface NotificationCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  count: number;
  unreadCount: number;
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  chat: MessageSquare,
  drive: Folder,
  notes: FileText,
  members: Users,
  business: Building,
  hr: UserCheck,
  system: AlertCircle,
  mentions: AtSign,
  calendar: Clock,
  scheduling: Clock,
  todo: Check,
  ai: Zap,
  place: MapPin,
};

// Fallback category mapping for legacy notification types
const LEGACY_TYPE_MAPPING: Record<string, string> = {
  'chat_message': 'chat',
  'chat_reaction': 'chat',
  'chat_mention': 'mentions',
  'mentions': 'mentions',
  'drive_shared': 'drive',
  'drive_permission': 'drive',
  'drive_item_restored': 'drive',
  'drive_item_deleted': 'drive',
  'business_invitation': 'business',
  'member_request': 'members',
  'system_alert': 'system',
  'calendar_reminder': 'calendar',
  'ai_suggestion': 'ai',
  'place_meeting_invite': 'place',
  'place_meeting_rsvp': 'place',
  'place_connection_request': 'place',
  'place_connection_accepted': 'place',
  'place_community_member_joined': 'place',
  'place_community_member_left': 'place',
  'place_community_invite': 'place',
  'notes_shared': 'notes',
};

function showNotificationActionError(message: string, error: unknown) {
  console.error(message, error);
  toast.error(message);
}

export default function NotificationsPage() {
  const { session, status, mounted } = useSafeSession();
  const router = useRouter();
  const { onNotification, onNotificationUpdate, onNotificationDelete } = useNotificationSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showRead, setShowRead] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleNotificationTypes, setModuleNotificationTypes] = useState<Map<string, string>>(new Map());
  const [categoryLabels, setCategoryLabels] = useState<Map<string, string>>(new Map());
  const [allCategories, setAllCategories] = useState<Set<string>>(new Set());
  const [moduleMetadata, setModuleMetadata] = useState<ModuleNotificationMetadata[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const limit = 50;

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen, closeMobileSidebar]);

  // Load module notification types on mount
  useEffect(() => {
    if (!mounted || status === "loading") return;

    const loadModuleTypes = async () => {
      try {
        const response = await getModuleNotificationTypes();
        const typeToCategory = new Map<string, string>();
        const categoryToLabel = new Map<string, string>();

        // Build mapping from module notification metadata
        const categoriesSet = new Set<string>();
        for (const module of response.modules) {
          for (const notificationType of module.notificationTypes) {
            typeToCategory.set(notificationType.type, notificationType.category);
            categoriesSet.add(notificationType.category);
            // Store category label (use module name as label if not set)
            if (!categoryToLabel.has(notificationType.category)) {
              categoryToLabel.set(notificationType.category, module.moduleName);
            }
          }
        }

        setModuleNotificationTypes(typeToCategory);
        setCategoryLabels(categoryToLabel);
        setAllCategories(categoriesSet);
        setModuleMetadata(response.modules);
      } catch (error) {
        console.error('Failed to load module notification types:', error);
        // Continue with legacy mapping if API fails
      }
    };

    loadModuleTypes();
  }, [mounted, status]);

  const getNormalizedType = (rawType: string): string => {
    // First check module metadata
    if (moduleNotificationTypes.has(rawType)) {
      return moduleNotificationTypes.get(rawType)!;
    }
    
    // Fallback to legacy mapping
    if (LEGACY_TYPE_MAPPING[rawType]) {
      return LEGACY_TYPE_MAPPING[rawType];
    }
    
    // Try to infer from type prefix (e.g., "hr_*" -> "hr")
    const prefix = rawType.split('_')[0];
    if (moduleNotificationTypes.has(prefix)) {
      return moduleNotificationTypes.get(prefix)!;
    }
    
    // Default to system
    return 'system';
  };

  // Load notifications from API
  useEffect(() => {
    if (!mounted || status === "loading") return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        
        if (viewMode === 'grouped') {
          const response = await getGroupedNotifications(limit);
          setGroups(response.groups);
        } else {
          const response = await getNotifications({
            page: 1,
            limit: limit,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });
          setNotifications(response.notifications);
          setHasMore(response.notifications.length === limit);
          setPage(1);
        }
      } catch (error) {
        showNotificationActionError('Failed to load notifications. Please try again.', error);
        // Fallback to mock data if API fails
        setNotifications([
          {
            id: '1',
            type: 'mentions',
            title: 'John Doe mentioned you in "Project Discussion"',
            body: 'Hey @andrew, can you review the latest design files?',
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            deleted: false,
            data: {
              conversationId: 'conv1',
              action: 'mention'
            }
          },
          {
            id: '2',
            type: 'drive',
            title: 'Sarah shared a file with you',
            body: 'Project_Design_v2.fig has been shared with you',
            read: false,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            deleted: false,
            data: {
              fileId: 'file1',
              action: 'shared'
            }
          },
          {
            id: '3',
            type: 'business',
            title: 'You\'ve been invited to join "TechCorp"',
            body: 'You have been invited to join TechCorp as a member',
            read: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            deleted: false,
            data: {
              businessId: 'business1',
              action: 'invitation'
            }
          },
          {
            id: '4',
            type: 'chat',
            title: 'New message in "Team Chat"',
            body: 'Alice: Great work on the latest update!',
            read: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            deleted: false,
            data: {
              conversationId: 'conv2',
              action: 'message'
            }
          },
          {
            id: '5',
            type: 'system',
            title: 'System maintenance scheduled',
            body: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM EST',
            read: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            deleted: false,
            data: {
              action: 'maintenance'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [mounted, status, viewMode, showArchived]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!mounted) return;

    const handleNewNotification = (newNotification: import('../../lib/notificationSocket').NotificationEvent) => {
      // Convert NotificationEvent to Notification by adding required 'deleted' property
      const notification: Notification = {
        ...newNotification,
        deleted: false,
      };
      if (viewMode === 'grouped') {
        // Reload groups when new notification arrives
        getGroupedNotifications(limit).then(response => {
          setGroups(response.groups);
        }).catch((error) => {
          showNotificationActionError('Failed to refresh notification groups.', error);
        });
      } else {
        // Add new notification to the top of the list
        setNotifications(prev => [notification, ...prev]);
      }
    };

    const handleNotificationUpdate = (data: { id: string; read?: boolean; deleted?: boolean }) => {
      if (viewMode === 'grouped') {
        // Reload groups when notification is updated
        getGroupedNotifications(limit).then(response => {
          setGroups(response.groups);
        }).catch((error) => {
          showNotificationActionError('Failed to refresh notification groups.', error);
        });
      } else {
        // Update notification read status
        setNotifications(prev => 
          prev.map(n => 
            n.id === data.id ? { ...n, read: data.read ?? n.read } : n
          )
        );
      }
    };

    const handleNotificationDelete = (data: { id: string }) => {
      if (viewMode === 'grouped') {
        // Reload groups when notification is deleted
        getGroupedNotifications(limit).then(response => {
          setGroups(response.groups);
        }).catch((error) => {
          showNotificationActionError('Failed to refresh notification groups.', error);
        });
      } else {
        // Remove deleted notification
        setNotifications(prev => 
          prev.filter(n => n.id !== data.id)
        );
      }
    };

    const offNew = onNotification(handleNewNotification);
    const offUpdate = onNotificationUpdate(handleNotificationUpdate);
    const offDelete = onNotificationDelete(handleNotificationDelete);
    return () => {
      offNew();
      offUpdate();
      offDelete();
    };
  }, [onNotification, onNotificationUpdate, onNotificationDelete, viewMode, mounted, limit]);

  // Build categories dynamically from module metadata (show all, even with 0 notifications)
  const categories: NotificationCategory[] = useMemo(() => {
    // Start with "All" category
    let allCount = 0;
    let allUnreadCount = 0;
    
    if (viewMode === 'grouped') {
      allCount = groups.reduce((sum, g) => sum + g.count, 0);
      allUnreadCount = groups.reduce((sum, g) => sum + (g.isRead ? 0 : g.count), 0);
    } else {
      allCount = notifications.length;
      allUnreadCount = notifications.filter(n => !n.read).length;
    }
    
    const categoryList: NotificationCategory[] = [
      { 
        id: 'all', 
        label: 'All', 
        icon: Bell, 
        count: allCount, 
        unreadCount: allUnreadCount 
      }
    ];

    // Get all categories from module metadata (not just ones with notifications)
    const categoriesToShow = allCategories.size > 0 
      ? Array.from(allCategories).sort()
      : // Fallback: get categories from existing notifications if metadata not loaded yet
        Array.from(new Set(
          viewMode === 'grouped' 
            ? groups.map(g => getNormalizedType(g.type))
            : notifications.map(n => getNormalizedType(n.type))
        )).sort();

    // Add all categories, even if they have 0 notifications
    for (const categoryId of categoriesToShow) {
      const label = categoryLabels.get(categoryId) || categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
      const Icon = CATEGORY_ICONS[categoryId] || Bell;

      let count = 0;
      let unreadCount = 0;
      
      if (viewMode === 'grouped') {
        const categoryGroups = groups.filter(g => getNormalizedType(g.type) === categoryId);
        count = categoryGroups.reduce((sum, g) => sum + g.count, 0);
        unreadCount = categoryGroups.reduce((sum, g) => sum + (g.isRead ? 0 : g.count), 0);
      } else {
        const categoryNotifications = notifications.filter(n => getNormalizedType(n.type) === categoryId);
        count = categoryNotifications.length;
        unreadCount = categoryNotifications.filter(n => !n.read).length;
      }

      categoryList.push({
        id: categoryId,
        label,
        icon: Icon,
        count,
        unreadCount
      });
    }

    // Always include system category if not already present
    if (!categoriesToShow.includes('system')) {
      let systemCount = 0;
      let systemUnreadCount = 0;
      
      if (viewMode === 'grouped') {
        const systemGroups = groups.filter(g => getNormalizedType(g.type) === 'system');
        systemCount = systemGroups.reduce((sum, g) => sum + g.count, 0);
        systemUnreadCount = systemGroups.reduce((sum, g) => sum + (g.isRead ? 0 : g.count), 0);
      } else {
        const systemNotifications = notifications.filter(n => getNormalizedType(n.type) === 'system');
        systemCount = systemNotifications.length;
        systemUnreadCount = systemNotifications.filter(n => !n.read).length;
      }
      
      categoryList.push({
        id: 'system',
        label: 'System',
        icon: AlertCircle,
        count: systemCount,
        unreadCount: systemUnreadCount
      });
    }

    return categoryList;
  }, [notifications, groups, viewMode, categoryLabels, allCategories]);

  // Calculate priority for notification based on module metadata
  const getNotificationPriority = (notification: Notification): 'low' | 'normal' | 'high' | 'urgent' => {
    // Use stored priority if available
    if (notification.priority) {
      return notification.priority;
    }
    
    // Get priority from module metadata
    for (const module of moduleMetadata) {
      for (const notificationType of module.notificationTypes) {
        if (notificationType.type === notification.type && notificationType.priority) {
          return notificationType.priority;
        }
      }
    }
    
    // Fallback to category-based priority
    const category = getNormalizedType(notification.type);
    if (category === 'mentions' || category === 'system') {
      return 'high';
    }
    if (category === 'chat' || category === 'drive') {
      return 'normal';
    }
    
    return 'normal';
  };

  const filteredNotifications = notifications.filter(notification => {
    // Category filter
    if (selectedCategory !== 'all' && getNormalizedType(notification.type) !== selectedCategory) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      const priority = getNotificationPriority(notification);
      if (priority !== priorityFilter) {
        return false;
      }
    }
    
    // Read/unread filter
    if (!showRead && notification.read) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.body?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Time range filter
    if (timeRange !== 'all') {
      const notificationDate = new Date(notification.createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (timeRange === 'today' && diffInDays > 0) {
        return false;
      }
      if (timeRange === 'week' && diffInDays > 7) {
        return false;
      }
      if (timeRange === 'month' && diffInDays > 30) {
        return false;
      }
    }
    
    // Filter out snoozed notifications
    if (notification.snoozedUntil) {
      const snoozeTime = new Date(notification.snoozedUntil);
      if (snoozeTime > new Date()) {
        return false;
      }
    }
    
    return true;
  });

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      // Category filter
      if (selectedCategory !== 'all' && getNormalizedType(group.type) !== selectedCategory) {
        return false;
      }
      
      // Read/unread filter
      if (!showRead && group.isRead) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const matchesTitle = group.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLatest = group.latestNotification.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesTitle && !matchesLatest) {
          return false;
        }
      }
      
      // Time range filter
      if (timeRange !== 'all') {
        const groupDate = new Date(group.updatedAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - groupDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (timeRange === 'today' && diffInDays > 0) {
          return false;
        }
        if (timeRange === 'week' && diffInDays > 7) {
          return false;
        }
        if (timeRange === 'month' && diffInDays > 30) {
          return false;
        }
      }
      
      return true;
    });
  }, [groups, selectedCategory, showRead, searchQuery, timeRange]);

  // Handle quick actions
  const handleQuickAction = async (notification: Notification, action: string) => {
    try {
      switch (action) {
        case 'view':
          // Navigate based on notification data
          if ((notification.data as any)?.fileId) {
            router.push(`/drive/shared?file=${(notification.data as any)?.fileId}`);
          } else if ((notification.data as any)?.conversationId) {
            router.push(`/chat?conversation=${(notification.data as any)?.conversationId}`);
          } else if ((notification.data as any)?.businessId) {
            router.push(`/business/${(notification.data as any)?.businessId}`);
          }
          await handleMarkAsRead(notification.id);
          break;
        case 'approve':
          // Handle approval action
          if ((notification.data as any)?.approvalId) {
            // Call approval endpoint
            const response = await fetch(`/api/ai/approvals/${(notification.data as any)?.approvalId}/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ response: 'approve' })
            });
            if (response.ok) {
              await handleMarkAsRead(notification.id);
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }
          }
          break;
        case 'reject':
          // Handle rejection action
          if ((notification.data as any)?.approvalId) {
            const response = await fetch(`/api/ai/approvals/${(notification.data as any)?.approvalId}/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ response: 'reject' })
            });
            if (response.ok) {
              await handleMarkAsRead(notification.id);
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }
          }
          break;
        case 'reply':
          // Navigate to reply
          if ((notification.data as any)?.conversationId) {
            router.push(`/chat?conversation=${(notification.data as any)?.conversationId}&reply=true`);
          }
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      showNotificationActionError('Failed to complete notification action. Please try again.', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // j/k navigation
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const items = viewMode === 'grouped' ? filteredGroups : filteredNotifications;
        if (items.length === 0) return;

        let newIndex = focusedIndex;
        if (e.key === 'j') {
          newIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
        } else {
          newIndex = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
        }
        setFocusedIndex(newIndex);

        // Scroll into view
        const element = document.querySelector(`[data-notification-index="${newIndex}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Space to mark as read
      if (e.key === ' ' && focusedIndex >= 0) {
        e.preventDefault();
        const items = viewMode === 'grouped' ? filteredGroups : filteredNotifications;
        if (items.length > focusedIndex) {
          const item = items[focusedIndex];
          if (viewMode === 'grouped') {
            markGroupAsRead((item as NotificationGroup).id);
          } else {
            handleMarkAsRead((item as Notification).id);
          }
        }
      }

      // Enter to open
      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const items = viewMode === 'grouped' ? filteredGroups : filteredNotifications;
        if (items.length > focusedIndex) {
          const item = items[focusedIndex];
          if (viewMode === 'list') {
            const notification = item as Notification;
            if ((notification.data as any)?.actionUrl) {
              router.push((notification.data as any).actionUrl);
            } else if ((notification.data as any)?.fileId) {
              router.push(`/drive/shared?file=${(notification.data as any)?.fileId}`);
            } else if ((notification.data as any)?.conversationId) {
              router.push(`/chat?conversation=${(notification.data as any)?.conversationId}`);
            }
          }
        }
      }

      // Escape to exit selection mode
      if (e.key === 'Escape' && selectionMode) {
        setSelectionMode(false);
        setSelectedNotifications(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, viewMode, filteredGroups, filteredNotifications, selectionMode]);

  const getNotificationIcon = (type: string) => {
    const category = getNormalizedType(type);
    return CATEGORY_ICONS[category] || Bell;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      showNotificationActionError('Failed to mark notification as read.', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      showNotificationActionError('Failed to mark all notifications as read.', error);
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      showNotificationActionError('Failed to archive notification.', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      showNotificationActionError('Failed to delete notification.', error);
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedNotifications.size === 0) return;
    try {
      await archiveMultipleNotifications(Array.from(selectedNotifications));
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
      setSelectionMode(false);
    } catch (error) {
      showNotificationActionError('Failed to archive notifications.', error);
    }
  };

  const requestBulkDelete = useCallback(() => {
    if (selectedNotifications.size === 0) return;
    setPendingBulkDelete(true);
  }, [selectedNotifications.size]);

  const executeBulkDelete = useCallback(async () => {
    if (!pendingBulkDelete || selectedNotifications.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedNotifications);
      await deleteMultipleNotifications(ids);
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
      setSelectionMode(false);
      setPendingBulkDelete(false);
    } catch (error) {
      showNotificationActionError('Failed to delete notifications.', error);
    } finally {
      setIsBulkDeleting(false);
    }
  }, [pendingBulkDelete, selectedNotifications]);

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    try {
      const ids = Array.from(selectedNotifications);
      await Promise.all(ids.map(id => markAsRead(id)));
      setNotifications(prev => 
        prev.map(n => selectedNotifications.has(n.id) ? { ...n, read: true } : n)
      );
      setSelectedNotifications(new Set());
      setSelectionMode(false);
    } catch (error) {
      showNotificationActionError('Failed to mark notifications as read.', error);
    }
  };

  const loadMore = async () => {
    try {
      const response = await getNotifications({
        page: page + 1,
        limit: limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setNotifications(prev => [...prev, ...response.notifications]);
      setHasMore(response.notifications.length === limit);
      setPage(prev => prev + 1);
    } catch (error) {
      showNotificationActionError('Failed to load more notifications.', error);
    }
  };


  if (!mounted || status === "loading") return null;
  if (!session?.user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedCategoryLabel =
    categories.find((category) => category.id === selectedCategory)?.label ?? 'All';

  const viewModeToggle = (
    <div
      className="flex items-center space-x-1 border border-gray-300 dark:border-slate-600 rounded-lg p-1"
      role="group"
      aria-label="Notification view mode"
    >
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === 'list'
            ? 'bg-blue-500 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
        title="List View"
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('grouped')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === 'grouped'
            ? 'bg-blue-500 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
        title="Grouped View"
        aria-label="Grouped view"
        aria-pressed={viewMode === 'grouped'}
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );

  const toolbarTrailing = selectionMode ? (
    <>
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {selectedNotifications.size} selected
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleBulkMarkAsRead}
        disabled={selectedNotifications.size === 0}
      >
        <Check className="w-4 h-4 mr-2" />
        Mark as read
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleBulkArchive}
        disabled={selectedNotifications.size === 0}
      >
        <Archive className="w-4 h-4 mr-2" />
        Archive
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={requestBulkDelete}
        disabled={selectedNotifications.size === 0}
      >
        Delete
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          try {
            await Promise.all(
              Array.from(selectedNotifications).map((id) => snoozeNotification(id, '1d'))
            );
            setNotifications((prev) => prev.filter((n) => !selectedNotifications.has(n.id)));
            setSelectedNotifications(new Set());
            setSelectionMode(false);
          } catch (error) {
            showNotificationActionError('Failed to snooze notifications.', error);
          }
        }}
        disabled={selectedNotifications.size === 0}
      >
        <Clock className="w-4 h-4 mr-2" />
        Snooze (1 day)
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectionMode(false);
          setSelectedNotifications(new Set());
        }}
      >
        Cancel
      </Button>
    </>
  ) : (
    <>
      {viewModeToggle}
      <Button variant="secondary" size="sm" onClick={() => setSelectionMode(true)}>
        Select
      </Button>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notifications`}
        icon={<Bell className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/notifications/settings')}
              aria-label="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </>
        }
      />

      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open notification categories"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {selectedCategoryLabel}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {mobileSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close categories panel"
            onClick={closeMobileSidebar}
          />
        ) : null}
        {/* Left Sidebar - Categories */}
        <div
          className={`w-64 shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4 ${
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-xl md:relative md:shadow-none'
              : 'hidden md:flex md:flex-col'
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10 md:hidden"
            onClick={closeMobileSidebar}
            aria-label="Close categories panel"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="space-y-1 overflow-y-auto pt-8 md:pt-0">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.id);
                  closeMobileSidebar();
                }}
                aria-current={selectedCategory === category.id ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <category.icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {category.unreadCount > 0 && (
                    <Badge color="red" size="sm">
                      {category.unreadCount}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400">({category.count})</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Notification List */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PageToolbar
            leading={
              <>
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
                <label className="flex shrink-0 items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={showRead}
                    onChange={(e) => setShowRead(e.target.checked)}
                    className="rounded"
                  />
                  <span>Show read</span>
                </label>
              </>
            }
            trailing={toolbarTrailing}
            secondary={
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
                  <div className="flex flex-wrap items-center gap-4">
                    {(
                      [
                        ['today', 'Today'],
                        ['week', 'This week'],
                        ['month', 'This month'],
                        ['all', 'All time'],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="radio"
                          name="timeRange"
                          value={value}
                          checked={timeRange === value}
                          onChange={(e) =>
                            setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')
                          }
                          className="rounded"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as 'all' | 'urgent' | 'high' | 'normal' | 'low')
                    }
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            }
          />

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : viewMode === 'grouped' ? (
              // Grouped View
              filteredGroups.length === 0 ? (
                <EmptyState 
                  category={selectedCategory}
                  hasFilters={selectedCategory !== 'all' || priorityFilter !== 'all' || searchQuery !== '' || timeRange !== 'all'}
                />
              ) : (
                <div className="space-y-3">
                  {filteredGroups.map((group) => {
                    const Icon = getNotificationIcon(getNormalizedType(group.type));
                    const isExpanded = expandedGroups.has(group.id);
                    const groupNotifications = isExpanded ? group.notifications : [group.latestNotification];
                    
                    return (
                      <div
                        key={group.id}
                        className={`bg-white dark:bg-slate-800 border rounded-lg transition-all hover:shadow-md ${
                          group.isRead ? 'opacity-75' : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        {/* Group Header */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          aria-label={`${group.title}, ${group.count} notifications`}
                          className="p-4 cursor-pointer"
                          onClick={() => {
                            setExpandedGroups(prev => {
                              const next = new Set(prev);
                              if (next.has(group.id)) {
                                next.delete(group.id);
                              } else {
                                next.add(group.id);
                              }
                              return next;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedGroups(prev => {
                                const next = new Set(prev);
                                if (next.has(group.id)) {
                                  next.delete(group.id);
                                } else {
                                  next.add(group.id);
                                }
                                return next;
                              });
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h3 className={`font-medium ${
                                    group.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {group.title}
                                  </h3>
                                  {!group.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  {group.count > 1 && (
                                    <Badge color="blue" size="sm">
                                      {group.count}
                                    </Badge>
                                  )}
                                  <Badge 
                                    color={group.priority === 'high' ? 'red' : group.priority === 'medium' ? 'yellow' : 'gray'}
                                    size="sm"
                                  >
                                    {group.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {getTimeAgo(group.updatedAt)}
                                  </span>
                                  <ChevronRight 
                                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                                      isExpanded ? 'transform rotate-90' : ''
                                    }`}
                                  />
                                </div>
                              </div>
                              {group.latestNotification.title && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {group.latestNotification.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Group Actions */}
                        <div className="px-4 pb-3 flex items-center space-x-2 border-t border-gray-200 dark:border-slate-700 pt-3">
                          {!group.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await markGroupAsRead(group.id);
                                  setGroups(prev => prev.map(g => 
                                    g.id === group.id ? { ...g, isRead: true } : g
                                  ));
                                } catch (error) {
                                  showNotificationActionError('Failed to mark group as read.', error);
                                }
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ids = group.notifications.map(n => n.id);
                              try {
                                await archiveMultipleNotifications(ids);
                                setGroups(prev => prev.filter(g => g.id !== group.id));
                              } catch (error) {
                                showNotificationActionError('Failed to archive group.', error);
                              }
                            }}
                          >
                            <Archive className="w-3 h-3 mr-1" />
                            Archive
                          </Button>
                        </div>
                        
                        {/* Expanded Notifications */}
                        {isExpanded && groupNotifications.length > 1 && (
                          <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                            {groupNotifications.slice(1).map((notification) => (
                              <div
                                key={notification.id}
                                className="p-3 border-b border-gray-200 dark:border-slate-700 last:border-b-0"
                              >
                                <p className="text-sm text-gray-700 dark:text-gray-300">{notification.title}</p>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {getTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : filteredNotifications.length === 0 ? (
              <EmptyState 
                category={selectedCategory}
                hasFilters={selectedCategory !== 'all' || priorityFilter !== 'all' || searchQuery !== '' || timeRange !== 'all'}
              />
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(getNormalizedType(notification.type));
                  const isSelected = selectedNotifications.has(notification.id);
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white dark:bg-slate-800 border rounded-lg px-4 pt-4 pb-2 transition-all hover:shadow-md ${
                        notification.read ? 'opacity-75' : 'border-blue-200 bg-blue-50'
                      } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                        selectionMode ? 'cursor-default' : 'cursor-pointer'
                      }`}
                      onClick={() => {
                        if (selectionMode) {
                          handleSelectNotification(notification.id);
                        } else {
                          // Auto-navigate to relevant resource if clickable (actionUrl for ai_suggestion)
                          if ((notification.data as any)?.actionUrl) {
                            router.push((notification.data as any).actionUrl);
                            handleMarkAsRead(notification.id);
                          } else if ((notification.data as any)?.fileId) {
                            router.push(`/drive/shared?file=${(notification.data as any)?.fileId}`);
                            handleMarkAsRead(notification.id);
                          } else if ((notification.data as any)?.folderId) {
                            router.push(`/drive/shared?folder=${(notification.data as any)?.folderId}`);
                            handleMarkAsRead(notification.id);
                          } else if ((notification.data as any)?.conversationId) {
                            router.push(`/chat?conversation=${(notification.data as any)?.conversationId}`);
                            handleMarkAsRead(notification.id);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {selectionMode && (
                          <div className="flex-shrink-0 pt-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectNotification(notification.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                          </div>
                        )}
                        <div className="flex-shrink-0">
                          <Avatar
                            src={notification.user?.name ? undefined : undefined}
                            nameOrEmail={notification.user?.name || notification.user?.email || 'System'}
                            size={40}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-medium truncate ${
                                  notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {notification.title}
                                </h3>
                                {notification.body && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{notification.body}</p>
                                )}
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                              {notification.priority && (
                                <Badge 
                                  color={
                                    notification.priority === 'urgent' ? 'red' :
                                    notification.priority === 'high' ? 'yellow' :
                                    notification.priority === 'normal' ? 'blue' : 'gray'
                                  }
                                  size="sm"
                                  className="flex-shrink-0"
                                >
                                  {notification.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {getTimeAgo(notification.createdAt)}
                              </span>
                              {!selectionMode && (
                                <NotificationActionsMenu
                                  notification={notification}
                                  onArchive={() => handleArchive(notification.id)}
                                  onDelete={() => handleDelete(notification.id)}
                                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                  onSnooze={async (duration) => {
                                    try {
                                      await snoozeNotification(notification.id, duration);
                                      setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                    } catch (error) {
                                      showNotificationActionError('Failed to snooze notification.', error);
                                    }
                                  }}
                                  onUnsnooze={async () => {
                                    try {
                                      await unsnoozeNotification(notification.id);
                                      // Reload notifications to show unsnoozed one
                                      const response = await getNotifications({
                                        page: 1,
                                        limit: limit,
                                        sortBy: 'createdAt',
                                        sortOrder: 'desc'
                                      });
                                      setNotifications(response.notifications);
                                    } catch (error) {
                                      showNotificationActionError('Failed to unsnooze notification.', error);
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          {/* Quick Actions */}
                          {!selectionMode && (
                            <NotificationQuickActions 
                              notification={notification}
                              moduleMetadata={moduleMetadata}
                              onAction={(action) => handleQuickAction(notification, action)}
                            />
                          )}
                          {notification.body && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {notification.body}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-3">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            {Boolean((notification.data as any)?.conversationId) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => {
                                  router.push(`/chat?conversation=${(notification.data as any)?.conversationId}`);
                                }}
                              >
                                <ChevronRight className="w-3 h-3 mr-1" />
                                Go to conversation
                              </Button>
                            )}
                            {Boolean((notification.data as any)?.fileId) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => {
                                  router.push(`/drive/shared?file=${(notification.data as any)?.fileId}`);
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <Folder className="w-3 h-3 mr-1" />
                                Open file
                              </Button>
                            )}
                            {Boolean((notification.data as any)?.folderId) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => {
                                  router.push(`/drive/shared?folder=${(notification.data as any)?.folderId}`);
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <Folder className="w-3 h-3 mr-1" />
                                Open folder
                              </Button>
                            )}
                            {Boolean((notification.data as any)?.actionUrl) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => {
                                  router.push((notification.data as any).actionUrl);
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <Zap className="w-3 h-3 mr-1" />
                                Open in AI
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Load More Button */}
            {!loading && hasMore && filteredNotifications.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingBulkDelete}
        onClose={() => setPendingBulkDelete(false)}
        onConfirm={executeBulkDelete}
        title="Delete notifications?"
        description={`Are you sure you want to delete ${selectedNotifications.size} notification${selectedNotifications.size === 1 ? '' : 's'}?`}
        variant="destructive"
        confirmLabel="Delete"
        loading={isBulkDeleting}
      />
    </div>
  );
}

// Notification Actions Menu Component
interface NotificationActionsMenuProps {
  notification: Notification;
  onArchive: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
  onSnooze?: (duration: '1h' | '1d' | '1w') => void;
  onUnsnooze?: () => void;
}

function NotificationActionsMenu({ notification, onArchive, onDelete, onMarkAsRead, onSnooze, onUnsnooze }: NotificationActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingNotificationToDelete, setPendingNotificationToDelete] = useState<string | null>(null);
  const [isDeletingNotification, setIsDeletingNotification] = useState(false);

  const isSnoozed = Boolean(
    notification.snoozedUntil && new Date(notification.snoozedUntil) > new Date()
  );

  const menuItems = useMemo((): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    if (!notification.read) {
      items.push({
        icon: <Check className="w-4 h-4" />,
        label: 'Mark as read',
        onClick: () => onMarkAsRead(),
      });
    }

    if (isSnoozed) {
      items.push({
        icon: <Clock className="w-4 h-4" />,
        label: 'Unsnooze',
        onClick: () => onUnsnooze?.(),
      });
    } else if (onSnooze) {
      items.push(
        { heading: true, label: 'Snooze' },
        {
          icon: <Clock className="w-4 h-4" />,
          label: '1 hour',
          onClick: () => onSnooze('1h'),
        },
        {
          icon: <Clock className="w-4 h-4 opacity-70" />,
          label: '1 day',
          onClick: () => onSnooze('1d'),
        },
        {
          icon: <Clock className="w-4 h-4 opacity-70" />,
          label: '1 week',
          onClick: () => onSnooze('1w'),
        }
      );
    }

    items.push({
      icon: <Archive className="w-4 h-4" />,
      label: 'Archive',
      onClick: () => onArchive(),
    });

    items.push(
      { divider: true },
      {
        label: 'Delete',
        destructive: true,
        onClick: () => setPendingNotificationToDelete(notification.id),
      }
    );

    return items;
  }, [
    notification.read,
    notification.id,
    isSnoozed,
    onMarkAsRead,
    onUnsnooze,
    onSnooze,
    onArchive,
  ]);

  const executeDeleteNotification = useCallback(async () => {
    if (pendingNotificationToDelete !== notification.id) return;
    setIsDeletingNotification(true);
    try {
      await onDelete();
      setPendingNotificationToDelete(null);
    } finally {
      setIsDeletingNotification(false);
    }
  }, [pendingNotificationToDelete, notification.id, onDelete]);

  return (
    <>
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
        items={menuItems}
        menuLabel="Notification actions"
        align="end"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Notification actions"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((v) => !v);
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenu>

    <ConfirmModal
      open={pendingNotificationToDelete === notification.id}
      onClose={() => setPendingNotificationToDelete(null)}
      onConfirm={executeDeleteNotification}
      title="Delete notification?"
      description="Are you sure you want to delete this notification?"
      variant="destructive"
      confirmLabel="Delete"
      loading={pendingNotificationToDelete === notification.id && isDeletingNotification}
    />
    </>
  );
}

// Quick Actions Component
interface NotificationQuickActionsProps {
  notification: Notification;
  moduleMetadata: ModuleNotificationMetadata[];
  onAction: (action: string) => void;
}

function NotificationQuickActions({ notification, moduleMetadata, onAction }: NotificationQuickActionsProps) {
  // Find notification type metadata
  let notificationType: ModuleNotificationType | null = null;
  for (const module of moduleMetadata) {
    const found = module.notificationTypes.find((nt: ModuleNotificationType) => nt.type === notification.type);
    if (found) {
      notificationType = found;
      break;
    }
  }

  // Determine actions based on notification type and data
  const getActions = () => {
    const actions: Array<{ id: string; label: string; icon: React.ComponentType<any>; variant?: 'primary' | 'secondary' }> = [];
    const data = notification.data as any;

    // Check if notification requires action
    if (notificationType?.requiresAction) {
      if (data?.approvalId) {
        actions.push(
          { id: 'approve', label: 'Approve', icon: Check, variant: 'primary' },
          { id: 'reject', label: 'Reject', icon: AlertCircle, variant: 'secondary' }
        );
      }
    }

    // Add view action for navigable notifications
    if (data?.fileId || data?.conversationId || data?.businessId) {
      actions.push({ id: 'view', label: 'View', icon: ChevronRight });
    }

    // Add reply action for chat notifications
    if (notification.type.startsWith('chat_') && data?.conversationId) {
      actions.push({ id: 'reply', label: 'Reply', icon: MessageSquare });
    }

    return actions;
  };

  const actions = getActions();
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              onAction(action.id);
            }}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : action.variant === 'secondary'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  category: string;
  hasFilters: boolean;
}

function EmptyState({ category, hasFilters }: EmptyStateProps) {
  const categoryMessages: Record<string, { icon: React.ComponentType<any>; title: string; message: string }> = {
    chat: {
      icon: MessageSquare,
      title: 'No chat notifications',
      message: 'You have no new messages or mentions. Start a conversation to see notifications here!'
    },
    drive: {
      icon: Folder,
      title: 'No file notifications',
      message: 'No files have been shared with you recently. Share files to receive notifications!'
    },
    mentions: {
      icon: AtSign,
      title: 'No mentions',
      message: 'No one has mentioned you recently. You\'ll see notifications here when someone tags you!'
    },
    business: {
      icon: Building,
      title: 'No business notifications',
      message: 'No business-related notifications. Invitations and updates will appear here!'
    },
    hr: {
      icon: UserCheck,
      title: 'No HR notifications',
      message: 'No HR updates or tasks. Onboarding tasks and time-off requests will appear here!'
    },
    calendar: {
      icon: Clock,
      title: 'No calendar notifications',
      message: 'No upcoming events or reminders. Create events to receive notifications!'
    },
    system: {
      icon: AlertCircle,
      title: 'No system notifications',
      message: 'No system updates or alerts. Important announcements will appear here!'
    },
    all: {
      icon: Bell,
      title: 'No notifications',
      message: 'You\'re all caught up!'
    }
  };

  const config = categoryMessages[category] || categoryMessages.all;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
      <Icon className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{config.title}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{config.message}</p>
      {hasFilters && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters to see more notifications</p>
      )}
    </div>
  );
} 