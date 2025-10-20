import express, { Response } from 'express';
import { logger } from '../lib/logger';
import { logService } from '../services/logService';
import { AuthenticatedRequest } from '../middleware/auth';

interface LogFilters {
  level?: 'debug' | 'info' | 'warn' | 'error';
  service?: 'vssyl-server' | 'vssyl-web';
  operation?: string;
  userId?: string;
  businessId?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface LogAlert {
  id: string;
  name: string;
  description: string;
  conditions: {
    level?: string[];
    operation?: string[];
    message?: string;
  };
  actions: {
    email?: string[];
    webhook?: string;
    threshold?: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const logController = {
  // Collect client logs from frontend
  async collectClientLog(req: express.Request, res: Response): Promise<void> {
    try {
      const logEntry = req.body;
      
      // Validate log entry structure
      if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
        res.status(400).json({ error: 'Invalid log entry format' });
        return;
      }

      // Store client log
      await logService.storeClientLog(logEntry);
      
      res.status(200).json({ success: true });
    } catch (error) {
      await logger.error('Failed to collect client log', {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to collect client log' });
    }
  },

  // Get logs with filtering
  async getLogs(req: express.Request, res: Response): Promise<void> {
    try {
      const filters: LogFilters = {
        level: req.query.level as LogFilters['level'],
        service: req.query.service as LogFilters['service'],
        operation: req.query.operation as string,
        userId: req.query.userId as string,
        businessId: req.query.businessId as string,
        module: req.query.module as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const logs = await logService.getLogs(filters);
      
      res.json({
        success: true,
        data: {
          logs: logs.entries,
          total: logs.total,
          hasMore: logs.hasMore
        }
      });
    } catch (error) {
      await logger.error('Failed to get logs', {
        operation: 'get_logs',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to retrieve logs' });
    }
  },

  // Export logs
  async exportLogs(req: express.Request, res: Response): Promise<void> {
    try {
      const filters: LogFilters = {
        level: req.query.level as LogFilters['level'],
        service: req.query.service as LogFilters['service'],
        operation: req.query.operation as string,
        userId: req.query.userId as string,
        businessId: req.query.businessId as string,
        module: req.query.module as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string
      };

      const format = req.query.format as string || 'json';
      const exportData = await logService.exportLogs(filters, format);
      
      // Set appropriate headers for download
      const filename = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.send(exportData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
      }
    } catch (error) {
      await logger.error('Failed to export logs', {
        operation: 'export_logs',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to export logs' });
    }
  },

  // Get log analytics
  async getLogAnalytics(req: express.Request, res: Response): Promise<void> {
    try {
      const filters: LogFilters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        businessId: req.query.businessId as string
      };

      const analytics = await logService.getLogAnalytics(filters);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      await logger.error('Failed to get log analytics', {
        operation: 'get_log_analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to retrieve log analytics' });
    }
  },

  // Get log alerts
  async getLogAlerts(req: express.Request, res: Response): Promise<void> {
    try {
      const alerts = await logService.getLogAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      await logger.error('Failed to get log alerts', {
        operation: 'get_log_alerts',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to retrieve log alerts' });
    }
  },

  // Create log alert
  async createLogAlert(req: express.Request, res: Response): Promise<void> {
    try {
      const alertData: Omit<LogAlert, 'id' | 'createdAt' | 'updatedAt'> = req.body;
      
      const alert = await logService.createLogAlert(alertData);
      
      res.status(201).json({
        success: true,
        data: alert
      });
    } catch (error) {
      await logger.error('Failed to create log alert', {
        operation: 'create_log_alert',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to create log alert' });
    }
  },

  // Update log alert
  async updateLogAlert(req: express.Request, res: Response): Promise<void> {
    try {
      const alertId = req.params.id;
      const updateData: Partial<Omit<LogAlert, 'id' | 'createdAt'>> = req.body;
      
      const alert = await logService.updateLogAlert(alertId, updateData);
      
      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      await logger.error('Failed to update log alert', {
        operation: 'update_log_alert',
        alertId: req.params.id,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to update log alert' });
    }
  },

  // Delete log alert
  async deleteLogAlert(req: express.Request, res: Response): Promise<void> {
    try {
      const alertId = req.params.id;
      
      await logService.deleteLogAlert(alertId);
      
      res.json({
        success: true,
        message: 'Log alert deleted successfully'
      });
    } catch (error) {
      await logger.error('Failed to delete log alert', {
        operation: 'delete_log_alert',
        alertId: req.params.id,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to delete log alert' });
    }
  },

  // Cleanup old logs
  async cleanupOldLogs(req: express.Request, res: Response): Promise<void> {
    try {
      const daysToKeep = parseInt(req.body.daysToKeep as string) || 30;
      
      const result = await logService.cleanupOldLogs(daysToKeep);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      await logger.error('Failed to cleanup old logs', {
        operation: 'cleanup_old_logs',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to cleanup old logs' });
    }
  },

  // Get retention settings
  async getRetentionSettings(req: express.Request, res: Response): Promise<void> {
    try {
      const settings = await logService.getRetentionSettings();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      await logger.error('Failed to get retention settings', {
        operation: 'get_retention_settings',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to retrieve retention settings' });
    }
  },

  // Update retention settings
  async updateRetentionSettings(req: express.Request, res: Response): Promise<void> {
    try {
      const settings = req.body;
      
      const updatedSettings = await logService.updateRetentionSettings(settings);
      
      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      await logger.error('Failed to update retention settings', {
        operation: 'update_retention_settings',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to update retention settings' });
    }
  },

  // Get log stream (for real-time updates)
  async getLogStream(req: express.Request, res: Response): Promise<void> {
    try {
      // This would typically be handled by WebSocket, but we can provide a polling endpoint
      const filters: LogFilters = {
        level: req.query.level as LogFilters['level'],
        service: req.query.service as LogFilters['service'],
        operation: req.query.operation as string,
        startDate: new Date(Date.now() - 60000).toISOString() // Last minute
      };

      const recentLogs = await logService.getLogs(filters);
      
      res.json({
        success: true,
        data: {
          logs: recentLogs.entries,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      await logger.error('Failed to get log stream', {
        operation: 'get_log_stream',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      res.status(500).json({ error: 'Failed to retrieve log stream' });
    }
  }
};
