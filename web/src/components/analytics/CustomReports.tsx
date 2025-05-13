import { useState } from 'react';
import { useCustomReports } from '../../hooks/useCustomReports';
import { format } from 'date-fns';
import { Card, Badge, Button, Modal, Input, Select, DatePicker } from '../ui';
import { logger } from '../../utils/logger';

const AVAILABLE_METRICS = [
  { id: 'total_views', name: 'Total Views', type: 'count', field: 'views', description: 'Total number of views' },
  { id: 'unique_views', name: 'Unique Views', type: 'count', field: 'uniqueViews', description: 'Number of unique viewers' },
  { id: 'avg_time_spent', name: 'Average Time Spent', type: 'average', field: 'timeSpent', description: 'Average time spent on content' },
  { id: 'engagement_rate', name: 'Engagement Rate', type: 'percentage', field: 'engagement', description: 'Percentage of engaged users' },
  { id: 'completion_rate', name: 'Completion Rate', type: 'percentage', field: 'completion', description: 'Percentage of completed views' },
  { id: 'bounce_rate', name: 'Bounce Rate', type: 'percentage', field: 'bounce', description: 'Percentage of bounced views' }
];

const AVAILABLE_FILTERS = [
  { field: 'contentType', label: 'Content Type' },
  { field: 'author', label: 'Author' },
  { field: 'tags', label: 'Tags' },
  { field: 'date', label: 'Date' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' }
];

export const CustomReports = () => {
  const {
    reports,
    selectedReport,
    reportResults,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
    selectReport
  } = useCustomReports();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<{
    name: string;
    description: string;
    metrics: typeof AVAILABLE_METRICS[number][];
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    timeRange: {
      start: Date;
      end: Date;
    };
  }>({
    name: '',
    description: '',
    metrics: [],
    filters: [],
    timeRange: {
      start: new Date(),
      end: new Date()
    }
  });

  const handleCreateReport = async () => {
    try {
      await createReport(editingReport);
      setIsModalOpen(false);
      setEditingReport({
        name: '',
        description: '',
        metrics: [],
        filters: [],
        timeRange: {
          start: new Date(),
          end: new Date()
        }
      });
    } catch (error) {
      logger.error('Error creating report:', error);
    }
  };

  const handleExecuteReport = async (reportId: string) => {
    try {
      await executeReport(reportId);
    } catch (error) {
      logger.error('Error executing report:', error);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="custom-reports">
      <div className="reports-header">
        <h2>Custom Reports</h2>
        <Button onClick={() => setIsModalOpen(true)}>Create New Report</Button>
      </div>

      <div className="reports-grid">
        {reports.map(report => (
          <Card
            key={report.id}
            className={`report-card ${selectedReport?.id === report.id ? 'active' : ''}`}
            onClick={() => selectReport(report.id)}
          >
            <h3>{report.name}</h3>
            <p className="description">{report.description}</p>
            <div className="metrics">
              {report.metrics.map(metric => (
                <Badge key={metric.id} variant="secondary">
                  {metric.name}
                </Badge>
              ))}
            </div>
            <div className="time-range">
              <span>{formatDate(report.timeRange.start)} - {formatDate(report.timeRange.end)}</span>
            </div>
            <div className="actions">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteReport(report.id);
                }}
              >
                Execute
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingReport(report);
                  setIsModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReport(report.id);
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {reportResults && (
        <div className="report-results">
          <h3>{reportResults.name}</h3>
          <div className="results-grid">
            {reportResults.results.map(result => (
              <Card key={result.metricId} className="result-card">
                <h4>{result.name}</h4>
                <p className="value">{result.value}</p>
                <p className="timestamp">
                  {format(new Date(result.timestamp), 'MMM d, yyyy h:mm a')}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReport.name ? 'Edit Report' : 'Create New Report'}
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Name</label>
            <Input
              value={editingReport.name}
              onChange={(e) => setEditingReport(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Report name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <Input
              value={editingReport.description}
              onChange={(e) => setEditingReport(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Report description"
            />
          </div>
          <div className="form-group">
            <label>Metrics</label>
            <Select
              multiple
              value={editingReport.metrics.map(m => m.id)}
              onChange={(values) => {
                const selectedMetrics = AVAILABLE_METRICS.filter(m => values.includes(m.id));
                setEditingReport(prev => ({ ...prev, metrics: selectedMetrics }));
              }}
              options={AVAILABLE_METRICS.map(m => ({ value: m.id, label: m.name }))}
            />
          </div>
          <div className="form-group">
            <label>Time Range</label>
            <div className="date-range">
              <DatePicker
                selected={editingReport.timeRange.start}
                onChange={(date) => setEditingReport(prev => ({
                  ...prev,
                  timeRange: { ...prev.timeRange, start: date }
                }))}
              />
              <span>to</span>
              <DatePicker
                selected={editingReport.timeRange.end}
                onChange={(date) => setEditingReport(prev => ({
                  ...prev,
                  timeRange: { ...prev.timeRange, end: date }
                }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Filters</label>
            {editingReport.filters.map((filter, index) => (
              <div key={index} className="filter-row">
                <Select
                  value={filter.field}
                  onChange={(value) => {
                    const newFilters = [...editingReport.filters];
                    newFilters[index] = { ...filter, field: value };
                    setEditingReport(prev => ({ ...prev, filters: newFilters }));
                  }}
                  options={AVAILABLE_FILTERS.map(f => ({ value: f.field, label: f.label }))}
                />
                <Select
                  value={filter.operator}
                  onChange={(value) => {
                    const newFilters = [...editingReport.filters];
                    newFilters[index] = { ...filter, operator: value };
                    setEditingReport(prev => ({ ...prev, filters: newFilters }));
                  }}
                  options={OPERATORS}
                />
                <Input
                  value={filter.value}
                  onChange={(e) => {
                    const newFilters = [...editingReport.filters];
                    newFilters[index] = { ...filter, value: e.target.value };
                    setEditingReport(prev => ({ ...prev, filters: newFilters }));
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFilters = editingReport.filters.filter((_, i) => i !== index);
                    setEditingReport(prev => ({ ...prev, filters: newFilters }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setEditingReport(prev => ({
                  ...prev,
                  filters: [...prev.filters, { field: '', operator: '', value: '' }]
                }));
              }}
            >
              Add Filter
            </Button>
          </div>
          <div className="modal-actions">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReport}>Save Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 