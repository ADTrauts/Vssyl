import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import DriveModule from '../modules/DriveModule';
import DriveSidebar from '../../app/drive/DriveSidebar';
import { Spinner } from 'shared/components';

// Lazy load enterprise module for better performance
const EnhancedDriveModule = lazy(() => import('./enterprise/EnhancedDriveModule'));

interface DriveModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Drive module
 * or the enhanced enterprise Drive module based on feature access
 * 
 * Includes DriveSidebar for context-aware navigation
 * Includes lazy loading for enterprise module to optimize bundle size
 */
export const DriveModuleWrapper: React.FC<DriveModuleWrapperProps> = ({
  className = '',
  refreshTrigger
}) => {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType, navigateToDashboard } = useDashboard();
  const router = useRouter();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check if user has enterprise Drive features
  const { hasAccess: hasEnterpriseFeatures } = useFeature('drive_advanced_sharing', businessId);
  
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(refreshTrigger || 0);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  
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

          await fetch('/api/drive/files', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.accessToken}` },
            body: formData,
          });
        }
        
        setLocalRefreshTrigger(prev => prev + 1);
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
      await fetch('/api/drive/folders', {
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
      
      setLocalRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create folder');
    }
  }, [session, currentDashboard]);

  const handleContextSwitch = useCallback(async (dashboardId: string) => {
    await navigateToDashboard(dashboardId);
    router.push(`/drive?dashboard=${dashboardId}`);
  }, [navigateToDashboard, router]);

  // If user has enterprise features and is in a business context, use enhanced module
  if (hasEnterpriseFeatures && businessId) {
    return (
      <div className={`flex h-full ${className}`}>
        <DriveSidebar
          onNewFolder={handleCreateFolder}
          onFileUpload={handleFileUpload}
          onFolderUpload={handleFileUpload}
          onContextSwitch={handleContextSwitch}
          onFolderSelect={setSelectedFolder}
          selectedFolderId={selectedFolder?.id}
        />
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Spinner size={32} />
                <p className="mt-4 text-sm text-gray-600">Loading enterprise drive...</p>
              </div>
            </div>
          }
        >
          <EnhancedDriveModule 
            businessId={businessId}
            className="flex-1"
            refreshTrigger={localRefreshTrigger}
          />
        </Suspense>
      </div>
    );
  }
  
  // Otherwise, use standard Drive module
  return (
    <div className={`flex h-full ${className}`}>
      <DriveSidebar
        onNewFolder={handleCreateFolder}
        onFileUpload={handleFileUpload}
        onFolderUpload={handleFileUpload}
        onContextSwitch={handleContextSwitch}
        onFolderSelect={setSelectedFolder}
        selectedFolderId={selectedFolder?.id}
      />
      <DriveModule 
        businessId={businessId || ''}
        className="flex-1"
        refreshTrigger={localRefreshTrigger}
      />
    </div>
  );
};

export default DriveModuleWrapper;
