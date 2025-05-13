import React from 'react';
import styles from './TemplateVersionGroup.module.css';

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

interface TemplateVersionGroupProps {
  versions: TemplateVersion[];
  onVersionSelect: (version: TemplateVersion) => void;
}

type DateGroup = {
  label: string;
  versions: TemplateVersion[];
};

export const TemplateVersionGroup: React.FC<TemplateVersionGroupProps> = ({
  versions,
  onVersionSelect,
}) => {
  const groupVersionsByDate = (versions: TemplateVersion[]): DateGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(today.getMonth() - 1);

    const groups: DateGroup[] = [
      { label: 'Today', versions: [] },
      { label: 'This Week', versions: [] },
      { label: 'This Month', versions: [] },
      { label: 'Older', versions: [] },
    ];

    versions.forEach(version => {
      const versionDate = new Date(version.timestamp);
      if (versionDate >= today) {
        groups[0].versions.push(version);
      } else if (versionDate >= thisWeek) {
        groups[1].versions.push(version);
      } else if (versionDate >= thisMonth) {
        groups[2].versions.push(version);
      } else {
        groups[3].versions.push(version);
      }
    });

    // Remove empty groups
    return groups.filter(group => group.versions.length > 0);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const groupedVersions = groupVersionsByDate(versions);

  return (
    <div className={styles.container}>
      {groupedVersions.map((group, index) => (
        <div key={index} className={styles.group}>
          <h3 className={styles.groupHeader}>{group.label}</h3>
          <div className={styles.versionsList}>
            {group.versions.map((version) => (
              <div
                key={version.version}
                className={styles.versionItem}
                onClick={() => onVersionSelect(version)}
              >
                <div className={styles.versionInfo}>
                  <span className={styles.versionNumber}>
                    Version {version.version}
                  </span>
                  <span className={styles.timestamp}>
                    {formatTimestamp(version.timestamp)}
                  </span>
                </div>
                <div className={styles.versionMeta}>
                  <span className={styles.author}>by {version.author}</span>
                  <span className={styles.changes}>
                    {version.changes.length} changes
                  </span>
                </div>
                {version.tags && version.tags.length > 0 && (
                  <div className={styles.tags}>
                    {version.tags.map(tag => (
                      <span
                        key={tag.id}
                        className={styles.tag}
                        style={{
                          backgroundColor: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 