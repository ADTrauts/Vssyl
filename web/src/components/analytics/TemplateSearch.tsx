import React, { useState, useMemo } from 'react';
import styles from './TemplateSearch.module.css';
import { ExportTemplate } from './ExportTemplates';

interface TemplateSearchProps {
  templates: ExportTemplate[];
  onSearch: (filteredTemplates: ExportTemplate[]) => void;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({ templates, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'csv' | 'excel'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map(t => t.categoryId).filter(Boolean));
    return Array.from(uniqueCategories);
  }, [templates]);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterTemplates(value, formatFilter, categoryFilter, sortBy, sortOrder);
  };

  const handleFormatChange = (format: 'all' | 'pdf' | 'csv' | 'excel') => {
    setFormatFilter(format);
    filterTemplates(searchTerm, format, categoryFilter, sortBy, sortOrder);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    filterTemplates(searchTerm, formatFilter, category, sortBy, sortOrder);
  };

  const handleSort = (field: 'name' | 'updated' | 'created') => {
    const newOrder = field === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    filterTemplates(searchTerm, formatFilter, categoryFilter, field, newOrder);
  };

  const filterTemplates = (
    search: string,
    format: 'all' | 'pdf' | 'csv' | 'excel',
    category: string,
    sort: 'name' | 'updated' | 'created',
    order: 'asc' | 'desc'
  ) => {
    let filtered = [...templates];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.fields.some(field => field.toLowerCase().includes(searchLower))
      );
    }

    // Apply format filter
    if (format !== 'all') {
      filtered = filtered.filter(template => template.format === format);
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(template => template.categoryId === category);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return order === 'asc' ? comparison : -comparison;
    });

    onSearch(filtered);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Format:</label>
          <select
            value={formatFilter}
            onChange={(e) => handleFormatChange(e.target.value as 'all' | 'pdf' | 'csv' | 'excel')}
            className={styles.filterSelect}
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Sort by:</label>
          <div className={styles.sortButtons}>
            <button
              className={`${styles.sortButton} ${sortBy === 'name' ? styles.active : ''}`}
              onClick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`${styles.sortButton} ${sortBy === 'updated' ? styles.active : ''}`}
              onClick={() => handleSort('updated')}
            >
              Updated {sortBy === 'updated' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`${styles.sortButton} ${sortBy === 'created' ? styles.active : ''}`}
              onClick={() => handleSort('created')}
            >
              Created {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSearch; 