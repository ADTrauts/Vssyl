import React, { useState } from 'react';
import styles from './TemplateCategories.module.css';
import { ExportTemplate } from './ExportTemplates';

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ExportTemplate[];
}

interface TemplateCategoriesProps {
  categories: TemplateCategory[];
  onCategoryAdd: (category: Omit<TemplateCategory, 'id'>) => void;
  onCategoryEdit: (category: TemplateCategory) => void;
  onCategoryDelete: (categoryId: string) => void;
  onTemplateMove: (templateId: string, categoryId: string) => void;
}

const TemplateCategories: React.FC<TemplateCategoriesProps> = ({
  categories,
  onCategoryAdd,
  onCategoryEdit,
  onCategoryDelete,
  onTemplateMove,
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    onCategoryAdd({
      name: newCategoryName,
      description: newCategoryDescription,
      templates: [],
    });

    setNewCategoryName('');
    setNewCategoryDescription('');
    setIsAddingCategory(false);
  };

  const handleEditCategory = (category: TemplateCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    onCategoryEdit({
      ...editingCategory,
      name: newCategoryName,
      description: newCategoryDescription,
    });

    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  return (
    <div className={styles.categoriesContainer}>
      <div className={styles.categoriesHeader}>
        <h3>Template Categories</h3>
        {!isAddingCategory && (
          <button
            className={styles.addButton}
            onClick={() => setIsAddingCategory(true)}
          >
            Add Category
          </button>
        )}
      </div>

      {isAddingCategory && (
        <div className={styles.categoryForm}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className={styles.input}
          />
          <textarea
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            placeholder="Category description"
            className={styles.textarea}
          />
          <div className={styles.formActions}>
            <button
              className={styles.submitButton}
              onClick={handleAddCategory}
            >
              Add
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName('');
                setNewCategoryDescription('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.categoriesList}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryItem}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryInfo}>
                <h4>{category.name}</h4>
                <p>{category.description}</p>
              </div>
              <div className={styles.categoryActions}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEditCategory(category)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onCategoryDelete(category.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className={styles.templatesList}>
              {category.templates.map((template) => (
                <div key={template.id} className={styles.templateItem}>
                  <span>{template.name}</span>
                  <select
                    value={category.id}
                    onChange={(e) => onTemplateMove(template.id, e.target.value)}
                    className={styles.moveSelect}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingCategory && (
        <div className={styles.editModal}>
          <div className={styles.editContent}>
            <h3>Edit Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className={styles.input}
            />
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Category description"
              className={styles.textarea}
            />
            <div className={styles.formActions}>
              <button
                className={styles.submitButton}
                onClick={handleUpdateCategory}
              >
                Update
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateCategories; 