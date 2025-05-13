import React, { useState } from 'react';
import styles from './TemplateShareDialog.module.css';
import { ExportTemplate } from './ExportTemplates';

interface TemplateShareDialogProps {
  template: ExportTemplate;
  onClose: () => void;
  onShare: (templateId: string, users: string[], permissions: string[]) => Promise<void>;
}

const TemplateShareDialog: React.FC<TemplateShareDialogProps> = ({
  template,
  onClose,
  onShare,
}) => {
  const [users, setUsers] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>(['view']);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState('');

  const handleAddUser = () => {
    if (!newUser.trim()) return;
    if (users.includes(newUser.trim())) {
      setError('User already added');
      return;
    }
    setUsers([...users, newUser.trim()]);
    setNewUser('');
    setError(null);
  };

  const handleRemoveUser = (user: string) => {
    setUsers(users.filter(u => u !== user));
  };

  const handlePermissionChange = (permission: string) => {
    setPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      }
      return [...prev, permission];
    });
  };

  const handleShare = async () => {
    if (users.length === 0) {
      setError('Please add at least one user');
      return;
    }

    try {
      setIsSharing(true);
      setError(null);
      await onShare(template.id, users, permissions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share template');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Share Template: {template.name}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.templateInfo}>
            <p>{template.description}</p>
            <div className={styles.meta}>
              <span>Format: {template.format.toUpperCase()}</span>
              <span>Version: {template.version}</span>
            </div>
          </div>

          <div className={styles.sharingSection}>
            <div className={styles.userInput}>
              <input
                type="text"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                placeholder="Enter user email or username"
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
              />
              <button
                className={styles.addButton}
                onClick={handleAddUser}
                disabled={!newUser.trim()}
              >
                Add User
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.usersList}>
              {users.map((user) => (
                <div key={user} className={styles.userItem}>
                  <span>{user}</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveUser(user)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.permissions}>
              <h4>Permissions</h4>
              <div className={styles.permissionOptions}>
                <label className={styles.permissionOption}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('view')}
                    onChange={() => handlePermissionChange('view')}
                  />
                  <span>View</span>
                </label>
                <label className={styles.permissionOption}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('edit')}
                    onChange={() => handlePermissionChange('edit')}
                  />
                  <span>Edit</span>
                </label>
                <label className={styles.permissionOption}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('share')}
                    onChange={() => handlePermissionChange('share')}
                  />
                  <span>Share</span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              className={styles.shareButton}
              onClick={handleShare}
              disabled={isSharing || users.length === 0}
            >
              {isSharing ? 'Sharing...' : 'Share Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateShareDialog; 