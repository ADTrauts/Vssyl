import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getDashboardFileSummary, 
  deleteDashboardWithFiles, 
  DashboardFileSummary, 
  FileHandlingAction 
} from '../api/dashboard';

interface Dashboard {
  id: string;
  name: string;
}

export function useDashboardDeletion() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [fileSummary, setFileSummary] = useState<DashboardFileSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDeletionModal = useCallback(async (dashboard: Dashboard) => {
    if (!session?.accessToken) {
      setError('Authentication required');
      return;
    }

    setSelectedDashboard(dashboard);
    setIsModalOpen(true);
    setIsLoadingSummary(true);
    setError(null);

    try {
      const summary = await getDashboardFileSummary(session.accessToken, dashboard.id);
      setFileSummary(summary);
    } catch (err) {
      console.error('Error loading file summary:', err);
      setError('Failed to load file summary');
      setFileSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [session?.accessToken]);

  const closeDeletionModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDashboard(null);
    setFileSummary(null);
    setError(null);
  }, []);

  const confirmDeletion = useCallback(async (fileAction: FileHandlingAction | null) => {
    if (!session?.accessToken || !selectedDashboard) {
      throw new Error('Authentication or dashboard selection required');
    }

    try {
      const result = await deleteDashboardWithFiles(
        session.accessToken, 
        selectedDashboard.id, 
        fileAction || undefined
      );
      
      console.log('Dashboard deletion result:', result);
      return result;
    } catch (err) {
      console.error('Error deleting dashboard:', err);
      throw err;
    }
  }, [session?.accessToken, selectedDashboard]);

  return {
    // State
    isModalOpen,
    selectedDashboard,
    fileSummary,
    isLoadingSummary,
    error,
    
    // Actions
    openDeletionModal,
    closeDeletionModal,
    confirmDeletion,
  };
} 