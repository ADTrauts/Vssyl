import React, { useState } from 'react';
import styles from './TemplateVersionTag.module.css';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface TemplateVersionTagProps {
  version: string;
  tags: VersionTag[];
  onAddTag: (version: string, tag: Omit<VersionTag, 'id'>) => void;
  onRemoveTag: (version: string, tagId: string) => void;
}

const TAG_COLORS = [
  { name: 'Blue', value: '#2196F3' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Red', value: '#F44336' },
  { name: 'Teal', value: '#009688' },
];

export const TemplateVersionTag: React.FC<TemplateVersionTagProps> = ({
  version,
  tags,
  onAddTag,
  onRemoveTag,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState<Omit<VersionTag, 'id'>>({
    name: '',
    color: TAG_COLORS[0].value,
    description: '',
  });

  const handleAddTag = () => {
    if (!newTag.name) return;
    onAddTag(version, newTag);
    setNewTag({
      name: '',
      color: TAG_COLORS[0].value,
      description: '',
    });
    setIsAdding(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tagsList}>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={styles.tag}
            style={{ backgroundColor: tag.color }}
          >
            <span className={styles.tagName}>{tag.name}</span>
            {tag.description && (
              <span className={styles.tagDescription}>{tag.description}</span>
            )}
            <button
              className={styles.removeTag}
              onClick={() => onRemoveTag(version, tag.id)}
            >
              ×
            </button>
          </div>
        ))}
        {!isAdding && (
          <button
            className={styles.addTagButton}
            onClick={() => setIsAdding(true)}
          >
            + Add Tag
          </button>
        )}
      </div>

      {isAdding && (
        <div className={styles.addTagForm}>
          <input
            type="text"
            placeholder="Tag Name"
            value={newTag.name}
            onChange={(e) =>
              setNewTag({ ...newTag, name: e.target.value })
            }
          />
          <select
            value={newTag.color}
            onChange={(e) =>
              setNewTag({ ...newTag, color: e.target.value })
            }
          >
            {TAG_COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newTag.description}
            onChange={(e) =>
              setNewTag({ ...newTag, description: e.target.value })
            }
          />
          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleAddTag}
            >
              Add Tag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 