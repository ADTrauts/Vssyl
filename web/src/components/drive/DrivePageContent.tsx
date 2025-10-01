'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../../contexts/DashboardContext';
import DriveSidebar from '../../app/drive/DriveSidebar';
import { DriveModuleWrapper } from './DriveModuleWrapper';

interface DrivePageContentProps {
  className?: string;
}

export function DrivePageContent({ className = '' }: DrivePageContentProps) {
  const { data: session } = useSession();
  const { currentDashboard, navigateToDashboard } = useDashboard();

  // File upload handler
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
          if (currentDashboard?.id) formData.append('dashboardId', currentDashboard.id);

          const response = await fetch('/api/drive/files', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.accessToken}` },
            body: formData,
          });

          if (!response.ok) {
            console.error('Upload failed:', response.status);
          }
        }
        
        // Trigger refresh - the module will handle this
        window.location.reload();
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };
    input.click();
  }, [session, currentDashboard]);

  // Folder creation handler
  const handleCreateFolder = useCallback(async () => {
    if (!session?.accessToken) return;

    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          name,
          dashboardId: currentDashboard?.id || null,
          parentId: null
        }),
      });

      if (!response.ok) {
        console.error('Failed to create folder');
      }
      
      // Trigger refresh
      window.location.reload();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  }, [session, currentDashboard]);

  // Context switch handler
  const handleContextSwitch = useCallback(async (dashboardId: string) => {
    await navigateToDashboard(dashboardId);
    window.location.href = `/drive?dashboard=${dashboardId}`;
  }, [navigateToDashboard]);

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Drive Sidebar - Same for all users */}
      <DriveSidebar 
        onNewFolder={handleCreateFolder} 
        onFileUpload={handleFileUpload} 
        onFolderUpload={handleFileUpload}
        onContextSwitch={handleContextSwitch}
      />
      
      {/* Main Content - Context-aware module */}
      <div className="flex-1 overflow-hidden">
        <DriveModuleWrapper className="h-full" />
      </div>
    </div>
  );
}

export default DrivePageContent;

