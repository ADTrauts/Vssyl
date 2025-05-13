import React, { useState, useMemo } from 'react';
import styles from './TemplateVersionFilter.module.css';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface TemplateVersion {
  version: string;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  author: string;
  tags?: VersionTag[];
}

type SortField = 'version' | 'date' | 'author' | 'changes';
type SortDirection = 'asc' | 'desc';

interface TemplateVersionFilterProps {
  versions: TemplateVersion[];
  onFilterChange: (filteredVersions: TemplateVersion[]) => void;
}

export const TemplateVersionFilter: React.FC<TemplateVersionFilterProps> = ({
  versions,
  onFilterChange,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get all unique tags from all versions
  const allTags = useMemo(() => {
    const tags = new Set<VersionTag>();
    versions.forEach(version => {
      version.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [versions]);

  // Sort and filter versions
  const filteredVersions = useMemo(() => {
    const result = versions.filter(version => {
      // Filter by tags
      if (selectedTags.length > 0) {
        const hasSelectedTag = version.tags?.some(tag => 
          selectedTags.includes(tag.id)
        );
        if (!hasSelectedTag) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          version.version.toLowerCase().includes(searchLower) ||
          version.author.toLowerCase().includes(searchLower) ||
          version.changes.some(change => 
            change.field.toLowerCase().includes(searchLower) ||
            String(change.oldValue).toLowerCase().includes(searchLower) ||
            String(change.newValue).toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sort versions
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'version':
          comparison = parseFloat(a.version) - parseFloat(b.version);
          break;
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'changes':
          comparison = a.changes.length - b.changes.length;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [versions, selectedTags, searchTerm, sortField, sortDirection]);

  // Update filtered versions when filters change
  React.useEffect(() => {
    onFilterChange(filteredVersions);
  }, [filteredVersions, onFilterChange]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchTerm('');
    setSortField('date');
    setSortDirection('desc');
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search versions..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        {(selectedTags.length > 0 || searchTerm || sortField !== 'date' || sortDirection !== 'desc') && (
          <button
            className={styles.clearButton}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className={styles.sortContainer}>
        <span className={styles.sortLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          <button
            className={`${styles.sortButton} ${sortField === 'date' ? styles.active : ''}`}
            onClick={() => handleSortChange('date')}
          >
            Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${sortField === 'version' ? styles.active : ''}`}
            onClick={() => handleSortChange('version')}
          >
            Version {sortField === 'version' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${sortField === 'author' ? styles.active : ''}`}
            onClick={() => handleSortChange('author')}
          >
            Author {sortField === 'author' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${sortField === 'changes' ? styles.active : ''}`}
            onClick={() => handleSortChange('changes')}
          >
            Changes {sortField === 'changes' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className={styles.tagsContainer}>
          <h4>Filter by Tags</h4>
          <div className={styles.tagsList}>
            {allTags.map(tag => (
              <button
                key={tag.id}
                className={`${styles.tagButton} ${
                  selectedTags.includes(tag.id) ? styles.selected : ''
                }`}
                style={{
                  backgroundColor: selectedTags.includes(tag.id)
                    ? tag.color
                    : 'transparent',
                  borderColor: tag.color,
                  color: selectedTags.includes(tag.id)
                    ? 'white'
                    : tag.color,
                }}
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterStats}>
        Showing {filteredVersions.length} of {versions.length} versions
      </div>
    </div>
  );
}; 