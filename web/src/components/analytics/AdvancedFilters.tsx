import { useState } from 'react';
import { useAdvancedFilters } from '../../hooks/useAdvancedFilters';
import { Card, Badge, Button, Modal, Input, Select } from '../ui';
import { logger } from '../../utils/logger';

const AVAILABLE_FIELDS = [
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'date', label: 'Date' },
  { value: 'tags', label: 'Tags' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In' },
  { value: 'notIn', label: 'Not In' }
];

export const AdvancedFilters = () => {
  const {
    filters,
    selectedFilter,
    filteredData,
    isLoading,
    error,
    createFilter,
    deleteFilter,
    applyFilter,
    selectFilter
  } = useAdvancedFilters();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<{
    name: string;
    description: string;
    filterGroups: Array<{
      conditions: Array<{
        field: string;
        operator: string;
        value: unknown;
      }>;
      operator: 'AND' | 'OR';
    }>;
  }>({
    name: '',
    description: '',
    filterGroups: [{
      conditions: [{
        field: '',
        operator: '',
        value: ''
      }],
      operator: 'AND'
    }]
  });

  const handleCreateFilter = async () => {
    try {
      await createFilter(editingFilter);
      setIsModalOpen(false);
      setEditingFilter({
        name: '',
        description: '',
        filterGroups: [{
          conditions: [{
            field: '',
            operator: '',
            value: ''
          }],
          operator: 'AND'
        }]
      });
    } catch (error) {
      logger.error('Error creating filter:', error);
    }
  };

  const handleApplyFilter = async (filterId: string) => {
    try {
      // This would be replaced with actual data from your analytics
      const data = [];
      await applyFilter(filterId, data);
    } catch (error) {
      logger.error('Error applying filter:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading filters...</p>
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
    <div className="advanced-filters">
      <div className="filters-header">
        <h2>Advanced Filters</h2>
        <Button onClick={() => setIsModalOpen(true)}>Create New Filter</Button>
      </div>

      <div className="filters-grid">
        {filters.map(filter => (
          <Card
            key={filter.id}
            className={`filter-card ${selectedFilter?.id === filter.id ? 'active' : ''}`}
            onClick={() => selectFilter(filter.id)}
          >
            <h3>{filter.name}</h3>
            <p className="description">{filter.description}</p>
            <div className="filter-groups">
              {filter.filterGroups.map((group, index) => (
                <div key={index} className="filter-group">
                  <Badge variant="secondary">{group.operator}</Badge>
                  {group.conditions.map((condition, condIndex) => (
                    <div key={condIndex} className="condition">
                      <span>{condition.field}</span>
                      <span>{condition.operator}</span>
                      <span>{condition.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="actions">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyFilter(filter.id);
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFilter(filter);
                  setIsModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFilter(filter.id);
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredData.length > 0 && (
        <div className="filtered-results">
          <h3>Filtered Results</h3>
          <div className="results-grid">
            {filteredData.map((item, index) => (
              <Card key={index} className="result-card">
                {/* Render filtered data items */}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFilter.name ? 'Edit Filter' : 'Create New Filter'}
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Name</label>
            <Input
              value={editingFilter.name}
              onChange={(e) => setEditingFilter(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Filter name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <Input
              value={editingFilter.description}
              onChange={(e) => setEditingFilter(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Filter description"
            />
          </div>
          {editingFilter.filterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="filter-group-editor">
              <div className="group-header">
                <Select
                  value={group.operator}
                  onChange={(value) => {
                    const newGroups = [...editingFilter.filterGroups];
                    newGroups[groupIndex] = { ...group, operator: value as 'AND' | 'OR' };
                    setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                  }}
                  options={[
                    { value: 'AND', label: 'AND' },
                    { value: 'OR', label: 'OR' }
                  ]}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const newGroups = editingFilter.filterGroups.filter((_, i) => i !== groupIndex);
                    setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                  }}
                >
                  Remove Group
                </Button>
              </div>
              {group.conditions.map((condition, condIndex) => (
                <div key={condIndex} className="condition-editor">
                  <Select
                    value={condition.field}
                    onChange={(value) => {
                      const newGroups = [...editingFilter.filterGroups];
                      newGroups[groupIndex].conditions[condIndex] = { ...condition, field: value };
                      setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                    }}
                    options={AVAILABLE_FIELDS}
                  />
                  <Select
                    value={condition.operator}
                    onChange={(value) => {
                      const newGroups = [...editingFilter.filterGroups];
                      newGroups[groupIndex].conditions[condIndex] = { ...condition, operator: value };
                      setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                    }}
                    options={OPERATORS}
                  />
                  <Input
                    value={condition.value}
                    onChange={(e) => {
                      const newGroups = [...editingFilter.filterGroups];
                      newGroups[groupIndex].conditions[condIndex] = { ...condition, value: e.target.value };
                      setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                    }}
                    placeholder="Value"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newGroups = [...editingFilter.filterGroups];
                      newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter((_, i) => i !== condIndex);
                      setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newGroups = [...editingFilter.filterGroups];
                  newGroups[groupIndex].conditions.push({
                    field: '',
                    operator: '',
                    value: ''
                  });
                  setEditingFilter(prev => ({ ...prev, filterGroups: newGroups }));
                }}
              >
                Add Condition
              </Button>
            </div>
          ))}
          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={() => {
                setEditingFilter(prev => ({
                  ...prev,
                  filterGroups: [...prev.filterGroups, {
                    conditions: [{
                      field: '',
                      operator: '',
                      value: ''
                    }],
                    operator: 'AND'
                  }]
                }));
              }}
            >
              Add Group
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFilter}>Save Filter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 