import React, { useState, useEffect } from 'react';
import styles from './TemplateManagement.module.css';
import ExportTemplates, { ExportTemplate } from './ExportTemplates';
import TemplateCategories from './TemplateCategories';
import { v4 as uuidv4 } from 'uuid';

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ExportTemplate[];
}

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  useEffect(() => {
    // Load templates and categories from localStorage
    const savedTemplates = localStorage.getItem('templates');
    const savedCategories = localStorage.getItem('templateCategories');

    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  useEffect(() => {
    // Save templates and categories to localStorage
    localStorage.setItem('templates', JSON.stringify(templates));
    localStorage.setItem('templateCategories', JSON.stringify(categories));
  }, [templates, categories]);

  const handleTemplateAdd = (template: Omit<ExportTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: ExportTemplate = {
      ...template,
      id: uuidv4(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTemplates((prev) => [...prev, newTemplate]);

    if (template.categoryId) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === template.categoryId
            ? { ...cat, templates: [...cat.templates, newTemplate] }
            : cat
        )
      );
    }
  };

  const handleTemplateEdit = (template: ExportTemplate) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === template.id
          ? { ...template, version: t.version + 1, updatedAt: new Date() }
          : t
      )
    );

    // Update template in category if it belongs to one
    if (template.categoryId) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === template.categoryId
            ? {
                ...cat,
                templates: cat.templates.map((t) =>
                  t.id === template.id
                    ? { ...template, version: t.version + 1, updatedAt: new Date() }
                    : t
                ),
              }
            : cat
        )
      );
    }
  };

  const handleTemplateDelete = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));

    // Remove template from category if it belongs to one
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        templates: cat.templates.filter((t) => t.id !== templateId),
      }))
    );
  };

  const handleTemplateExport = (template: ExportTemplate) => {
    // Implement export functionality
    console.log('Exporting template:', template);
  };

  const handleCategoryAdd = (category: Omit<TemplateCategory, 'id'>) => {
    const newCategory: TemplateCategory = {
      ...category,
      id: uuidv4(),
    };

    setCategories((prev) => [...prev, newCategory]);
  };

  const handleCategoryEdit = (category: TemplateCategory) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === category.id ? category : cat))
    );
  };

  const handleCategoryDelete = (categoryId: string) => {
    // Move templates from deleted category to ungrouped
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setTemplates((prev) =>
        prev.map((template) =>
          template.categoryId === categoryId
            ? { ...template, categoryId: undefined }
            : template
        )
      );
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
  };

  const handleTemplateMove = (templateId: string, categoryId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, categoryId: categoryId || undefined }
          : template
      )
    );

    // Update categories
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          const template = templates.find((t) => t.id === templateId);
          if (template && !cat.templates.some((t) => t.id === templateId)) {
            return { ...cat, templates: [...cat.templates, template] };
          }
        } else {
          return {
            ...cat,
            templates: cat.templates.filter((t) => t.id !== templateId),
          };
        }
        return cat;
      })
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Template Management</h2>
      </div>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <TemplateCategories
            categories={categories}
            onCategoryAdd={handleCategoryAdd}
            onCategoryEdit={handleCategoryEdit}
            onCategoryDelete={handleCategoryDelete}
            onTemplateMove={handleTemplateMove}
          />
        </div>
        <div className={styles.main}>
          <ExportTemplates
            templates={templates}
            onTemplateAdd={handleTemplateAdd}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDelete={handleTemplateDelete}
            onTemplateExport={handleTemplateExport}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateManagement; 