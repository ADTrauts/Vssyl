'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, Badge, Button, Card, Spinner, Checkbox, Modal, ConfirmModal } from 'shared/components';
import HouseholdMemberManager from '../household/HouseholdMemberManager';
import { isHouseholdRosterManager } from '../../lib/householdPermissions';
import { getConnections, Connection, removeConnection, bulkRemoveConnections } from '../../api/member';
import { getHouseholds, type Household } from '../../api/household';
import { getUserFollowing } from '../../api/business';
import { Trash2, Building2, Users, MapPin, UserPlus } from 'lucide-react';
import { BulkActionBar } from './BulkActionBar';
import toast from 'react-hot-toast';

export type ConnectionFilterType = 'all' | 'colleague' | 'regular' | 'household' | 'businesses';

interface ConnectionListProps {
  className?: string;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [following, setFollowing] = useState<Array<{ id: string; name: string; description?: string | null; followedAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConnectionFilterType>('all');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [managingHouseholdId, setManagingHouseholdId] = useState<string | null>(null);
  const [pendingConnectionToRemove, setPendingConnectionToRemove] = useState<{ id: string; userName: string } | null>(null);
  const [pendingBulkConnectionsToRemove, setPendingBulkConnectionsToRemove] = useState<string[] | null>(null);

  const loadConnections = async () => {
    if (filter === 'household' || filter === 'businesses') return;
    try {
      setLoading(true);
      setError(null);
      const response = await getConnections(filter);
      setConnections(response.connections);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const loadHouseholds = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      setHouseholds([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await getHouseholds(session.accessToken);
      setHouseholds(list);
    } catch (err) {
      console.error('Error loading households:', err);
      setError('Failed to load households');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      setFollowing([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getUserFollowing(session.accessToken);
      const list = res.following ?? [];
      // Normalize to flat shape (backend returns { id, name, description, followedAt })
      setFollowing(
        list.map((f: { id?: string; name?: string; description?: string | null; followedAt: string; business?: { id: string; name: string } }) => ({
          id: f.id ?? f.business?.id ?? '',
          name: f.name ?? f.business?.name ?? '',
          description: f.description ?? null,
          followedAt: f.followedAt,
        }))
      );
    } catch (err) {
      console.error('Error loading followed businesses:', err);
      setError('Failed to load followed businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'household') loadHouseholds();
    else if (filter === 'businesses') loadFollowing();
    else loadConnections();
  }, [filter, session?.accessToken]);

  const requestRemoveConnection = (connectionId: string, userName: string) => {
    setPendingConnectionToRemove({ id: connectionId, userName });
  };

  const executeRemoveConnection = async () => {
    const pending = pendingConnectionToRemove;
    if (!pending) return;

    setRemovingId(pending.id);
    try {
      await removeConnection(pending.id);
      toast.success(`Connection with ${pending.userName} removed`);
      setPendingConnectionToRemove(null);
      loadConnections();
    } catch (err) {
      console.error('Error removing connection:', err);
      toast.error('Failed to remove connection');
    } finally {
      setRemovingId(null);
    }
  };

  const requestBulkRemoveConnections = () => {
    if (selectedConnections.size === 0) return;
    setPendingBulkConnectionsToRemove(Array.from(selectedConnections));
  };

  const executeBulkRemoveConnections = async () => {
    const connectionIds = pendingBulkConnectionsToRemove;
    if (!connectionIds || connectionIds.length === 0) return;

    setBulkLoading(true);
    try {
      const response = await bulkRemoveConnections(connectionIds);

      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully removed ${successCount} connection${successCount > 1 ? 's' : ''}`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to remove ${failureCount} connection${failureCount > 1 ? 's' : ''}`);
      }

      setSelectedConnections(new Set());
      setPendingBulkConnectionsToRemove(null);
      loadConnections();
    } catch (err) {
      console.error('Error removing connections:', err);
      toast.error('Failed to remove connections');
    } finally {
      setBulkLoading(false);
    }
  };

  const pendingBulkRemoveCount = pendingBulkConnectionsToRemove?.length ?? 0;
  const pendingBulkRemoveDescription =
    pendingBulkConnectionsToRemove && pendingBulkRemoveCount > 0
      ? pendingBulkRemoveCount === 1
        ? (() => {
            const conn = connections.find((c) => c.id === pendingBulkConnectionsToRemove[0]);
            const name = conn?.user.name || conn?.user.email || 'this user';
            return `Remove connection with ${name}?`;
          })()
        : `Remove ${pendingBulkRemoveCount} connections?`
      : '';

  const handleSelectConnection = (connectionId: string, checked: boolean) => {
    const newSelected = new Set(selectedConnections);
    if (checked) {
      newSelected.add(connectionId);
    } else {
      newSelected.delete(connectionId);
    }
    setSelectedConnections(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConnections(new Set(connections.map(conn => conn.id)));
    } else {
      setSelectedConnections(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedConnections(new Set());
  };

  const getConnectionTypeLabel = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'Colleague' : 'Connection';
  };

  const getConnectionTypeColor = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'blue' : 'gray';
  };

  const handleRetry = () => {
    if (filter === 'household') loadHouseholds();
    else if (filter === 'businesses') loadFollowing();
    else loadConnections();
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRetry} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Modal
        open={managingHouseholdId !== null}
        onClose={() => setManagingHouseholdId(null)}
        title="Household members"
        size="xlarge"
      >
        {managingHouseholdId && (
          <div className="max-h-[min(70vh,640px)] overflow-y-auto pr-1 -mr-1">
            <HouseholdMemberManager
              householdId={managingHouseholdId}
              onRosterChanged={() => {
                void loadHouseholds();
              }}
            />
          </div>
        )}
      </Modal>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex-wrap gap-1">
        {[
          { key: 'all' as const, label: 'ALL' },
          { key: 'regular' as const, label: 'Personal' },
          { key: 'household' as const, label: 'Household' },
          { key: 'businesses' as const, label: 'Following' },
          { key: 'colleague' as const, label: 'Colleagues' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 min-w-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Household view */}
      {filter === 'household' && (
        <div className="space-y-4">
          {households.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No households yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create or join a household from the Home tab to see members here.
              </p>
            </div>
          ) : (
            households.map((h) => {
              const myId = session?.user?.id;
              const myRole = myId ? h.members?.find((m) => m.userId === myId)?.role : undefined;
              const canManageThisHousehold = isHouseholdRosterManager(myRole);
              return (
              <Card key={h.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{h.name}</h3>
                    {h.isPrimary && (
                      <Badge color="blue">Primary</Badge>
                    )}
                  </div>
                  {canManageThisHousehold && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex items-center gap-1.5"
                      onClick={() => setManagingHouseholdId(h.id)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Add / remove members
                    </Button>
                  )}
                </div>
                <ul className="space-y-2 pl-7">
                  {h.members?.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Avatar
                        src={undefined}
                        nameOrEmail={m.user?.name ?? m.user?.email}
                        size={24}
                      />
                      <span>{m.user?.name ?? m.user?.email}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
            })
          )}
        </div>
      )}

      {/* Businesses / Following view */}
      {filter === 'businesses' && (
        <div className="space-y-4">
          {following.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No businesses followed</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Follow businesses on Vssyl Place to see them here.
              </p>
              <Link
                href="/place"
                className="inline-flex items-center px-4 py-2 rounded font-semibold bg-gray-200 text-gray-900 dark:text-gray-100 hover:bg-gray-300"
              >
                Explore Place
              </Link>
            </div>
          ) : (
            following.map((b) => (
              <Card key={b.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{b.name}</h3>
                  {b.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{b.description}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Following since {new Date(b.followedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/place?tab=my-place&highlight=${encodeURIComponent(b.id)}`}
                  className="inline-flex items-center px-2 py-1 text-sm rounded font-semibold bg-gray-200 text-gray-900 dark:text-gray-100 hover:bg-gray-300"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  View on Place
                </Link>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Connections list (all / colleague / personal) */}
      {filter !== 'household' && filter !== 'businesses' && (
        <>
      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedConnections.size}
        totalCount={connections.length}
        actions={[
          {
            id: 'remove',
            label: `Remove (${selectedConnections.size})`,
            icon: Trash2,
            variant: 'secondary' as const,
            onClick: requestBulkRemoveConnections,
            disabled: bulkLoading,
          },
        ]}
        onClearSelection={handleClearSelection}
        className="mb-4"
      />

      {/* Connections List */}
      {connections.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No connections yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filter === 'all' 
              ? "You haven't made any connections yet. Start by searching for users to connect with."
              : filter === 'colleague'
              ? "You don't have any current colleagues. Colleagues are people you're connected with who are still in a business with you."
              : "You don't have any personal connections yet."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Row */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Checkbox
              checked={selectedConnections.size === connections.length && connections.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({connections.length})
            </span>
          </div>

          {connections.map((connection) => (
            <Card key={connection.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedConnections.has(connection.id)}
                    onChange={(e) => handleSelectConnection(connection.id, e.target.checked)}
                  />
                  <Avatar
                    src={undefined}
                    nameOrEmail={connection.user.name || connection.user.email}
                    size={40}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {connection.user.name || 'Unknown User'}
                      </h3>
                      <Badge
                        color={getConnectionTypeColor(connection.type)}
                      >
                        {getConnectionTypeLabel(connection.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {connection.user.email}
                    </p>
                    {connection.user.organization && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {connection.user.organization.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {connection.user.organization.role.toLowerCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Connected since {new Date(connection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => requestRemoveConnection(connection.id, connection.user.name || connection.user.email)}
                    disabled={removingId === connection.id}
                  >
                    {removingId === connection.id ? <Spinner size={16} /> : 'Remove'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
        </>
      )}

      <ConfirmModal
        open={pendingConnectionToRemove !== null}
        onClose={() => setPendingConnectionToRemove(null)}
        onConfirm={executeRemoveConnection}
        title="Remove connection?"
        description={
          pendingConnectionToRemove
            ? `Remove connection with ${pendingConnectionToRemove.userName}?`
            : ''
        }
        variant="destructive"
        confirmLabel="Remove"
        loading={removingId === pendingConnectionToRemove?.id}
      />

      <ConfirmModal
        open={pendingBulkConnectionsToRemove !== null}
        onClose={() => setPendingBulkConnectionsToRemove(null)}
        onConfirm={executeBulkRemoveConnections}
        title="Remove connections?"
        description={pendingBulkRemoveDescription}
        variant="destructive"
        confirmLabel="Remove"
        loading={bulkLoading}
      />
    </div>
  );
}; 