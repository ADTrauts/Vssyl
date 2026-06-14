'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../contexts/DashboardContext';
import DriveSidebar from '../../app/drive/DriveSidebar';
import { DriveModuleWrapper } from './DriveModuleWrapper';
import { DriveCreateFolderModal } from './DriveCreateFolderModal';
import {
  WorkspaceSplitLayout,
  WorkspaceSidebar,
  WorkspaceMain,
} from '../layouts';

export interface DriveWorkspaceLandingProps {
  dashboardId?: string | null;
  businessId: string;
  className?: string;
}

/**
 * Business workspace entry for File Hub — owns sidebar, upload, and folder actions.
 */
export function DriveWorkspaceLanding({
  dashboardId,
  businessId,
  className = '',
}: DriveWorkspaceLandingProps) {
  const { data: session } = useSession();
  const { navigateToDashboard } = useDashboard();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (!files || !session?.accessToken) return;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          if (dashboardId) formData.append('dashboardId', dashboardId);

          await fetch('/api/drive/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            body: formData,
          });
        }
        setRefreshTrigger((prev) => prev + 1);
      } catch (error: unknown) {
        console.error('Upload failed:', error);
      }
    };
    input.click();
  }, [session, dashboardId]);

  const requestCreateFolder = useCallback(() => {
    if (!session?.accessToken) return;
    setCreateFolderOpen(true);
  }, [session?.accessToken]);

  const executeCreateFolder = useCallback(
    async (name: string) => {
      if (!session?.accessToken) return;

      try {
        setIsCreatingFolder(true);
        const response = await fetch('/api/drive/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            name,
            dashboardId: dashboardId ?? null,
            parentId: selectedFolder?.id ?? null,
          }),
        });

        if (!response.ok) {
          console.error('Failed to create folder');
          return;
        }

        setRefreshTrigger((prev) => prev + 1);
        setCreateFolderOpen(false);
      } catch (error: unknown) {
        console.error('Failed to create folder:', error);
      } finally {
        setIsCreatingFolder(false);
      }
    },
    [session, dashboardId, selectedFolder?.id]
  );

  const handleContextSwitch = useCallback(
    async (nextDashboardId: string) => {
      await navigateToDashboard(nextDashboardId);
      router.push(`/business/${businessId}/workspace?module=drive`);
    },
    [navigateToDashboard, router, businessId]
  );

  return (
    <>
      <WorkspaceSplitLayout className={className}>
        <WorkspaceSidebar>
          <DriveSidebar
            onNewFolder={requestCreateFolder}
            onFileUpload={handleFileUpload}
            onFolderUpload={handleFileUpload}
            onContextSwitch={handleContextSwitch}
            onFolderSelect={(folderId) => setSelectedFolder(folderId ? { id: folderId } : null)}
            selectedFolderId={selectedFolder?.id}
            lockedDashboardId={dashboardId ?? undefined}
          />
        </WorkspaceSidebar>
        <WorkspaceMain overflow="hidden">
          <DriveModuleWrapper
            className="h-full"
            refreshTrigger={refreshTrigger}
            dashboardId={dashboardId}
            businessId={businessId}
            selectedFolderId={selectedFolder?.id ?? null}
            onFolderSelect={(folderId) => setSelectedFolder(folderId ? { id: folderId } : null)}
          />
        </WorkspaceMain>
      </WorkspaceSplitLayout>
      <DriveCreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onSubmit={executeCreateFolder}
        loading={isCreatingFolder}
      />
    </>
  );
}

export default DriveWorkspaceLanding;
