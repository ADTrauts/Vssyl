import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface ReportMetric {
  id: string;
  name: string;
  type: 'count' | 'sum' | 'average' | 'percentage';
  field: string;
  description: string;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  metrics: ReportMetric[];
  filters: ReportFilter[];
  timeRange: {
    start: Date;
    end: Date;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportResult {
  reportId: string;
  name: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  results: Array<{
    metricId: string;
    name: string;
    value: number;
    timestamp: Date;
  }>;
}

export const useCustomReports = () => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [reportResults, setReportResults] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/custom-reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      logger.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReport = useCallback(async (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/custom-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      if (!response.ok) throw new Error('Failed to create report');
      const data = await response.json();
      setReports(prev => [...prev, data]);
      return data;
    } catch (error) {
      logger.error('Error creating report:', error);
      setError('Failed to create report');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateReport = useCallback(async (reportId: string, updates: Partial<CustomReport>) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/custom-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update report');
      const data = await response.json();
      setReports(prev => prev.map(report => report.id === reportId ? data : report));
      if (selectedReport?.id === reportId) {
        setSelectedReport(data);
      }
      return data;
    } catch (error) {
      logger.error('Error updating report:', error);
      setError('Failed to update report');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedReport]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/custom-reports/${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      setReports(prev => prev.filter(report => report.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setReportResults(null);
      }
    } catch (error) {
      logger.error('Error deleting report:', error);
      setError('Failed to delete report');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedReport]);

  const executeReport = useCallback(async (reportId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/custom-reports/${reportId}/execute`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to execute report');
      const data = await response.json();
      setReportResults(data);
      return data;
    } catch (error) {
      logger.error('Error executing report:', error);
      setError('Failed to execute report');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectReport = useCallback(async (reportId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/custom-reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setSelectedReport(data);
    } catch (error) {
      logger.error('Error selecting report:', error);
      setError('Failed to select report');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    selectedReport,
    reportResults,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
    selectReport,
    fetchReports
  };
}; 