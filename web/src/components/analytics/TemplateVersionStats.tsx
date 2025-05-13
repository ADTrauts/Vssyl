import React from 'react';
import styles from './TemplateVersionStats.module.css';

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

interface TemplateVersionStatsProps {
  versions: TemplateVersion[];
}

interface VersionStats {
  totalVersions: number;
  averageChangesPerVersion: number;
  mostActiveAuthor: string;
  authorStats: { [key: string]: number };
  changeFrequency: { [key: string]: number };
  tagUsage: { [key: string]: number };
  timeDistribution: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    older: number;
  };
}

export const TemplateVersionStats: React.FC<TemplateVersionStatsProps> = ({
  versions,
}) => {
  const calculateStats = (): VersionStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(today.getMonth() - 1);

    const authorStats: { [key: string]: number } = {};
    const changeFrequency: { [key: string]: number } = {};
    const tagUsage: { [key: string]: number } = {};
    let totalChanges = 0;

    versions.forEach(version => {
      // Author stats
      authorStats[version.author] = (authorStats[version.author] || 0) + 1;

      // Change frequency
      version.changes.forEach(change => {
        changeFrequency[change.field] = (changeFrequency[change.field] || 0) + 1;
        totalChanges++;
      });

      // Tag usage
      version.tags?.forEach(tag => {
        tagUsage[tag.name] = (tagUsage[tag.name] || 0) + 1;
      });
    });

    // Time distribution
    const timeDistribution = versions.reduce(
      (acc, version) => {
        const versionDate = new Date(version.timestamp);
        if (versionDate >= today) acc.today++;
        else if (versionDate >= thisWeek) acc.thisWeek++;
        else if (versionDate >= thisMonth) acc.thisMonth++;
        else acc.older++;
        return acc;
      },
      { today: 0, thisWeek: 0, thisMonth: 0, older: 0 }
    );

    // Find most active author
    const mostActiveAuthor = Object.entries(authorStats).reduce(
      (max, [author, count]) => (count > (max.count || 0) ? { author, count } : max),
      { author: '', count: 0 }
    ).author;

    return {
      totalVersions: versions.length,
      averageChangesPerVersion: totalChanges / versions.length,
      mostActiveAuthor,
      authorStats,
      changeFrequency,
      tagUsage,
      timeDistribution,
    };
  };

  const stats = calculateStats();

  const formatPercentage = (value: number, total: number) => {
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const renderTimeDistribution = () => {
    const total = Object.values(stats.timeDistribution).reduce((a, b) => a + b, 0);
    return (
      <div className={styles.timeDistribution}>
        <div className={styles.timeBar}>
          <div
            className={styles.timeSegment}
            style={{
              width: formatPercentage(stats.timeDistribution.today, total),
              backgroundColor: '#4CAF50',
            }}
            title={`Today: ${stats.timeDistribution.today} versions`}
          />
          <div
            className={styles.timeSegment}
            style={{
              width: formatPercentage(stats.timeDistribution.thisWeek, total),
              backgroundColor: '#2196F3',
            }}
            title={`This Week: ${stats.timeDistribution.thisWeek} versions`}
          />
          <div
            className={styles.timeSegment}
            style={{
              width: formatPercentage(stats.timeDistribution.thisMonth, total),
              backgroundColor: '#FFC107',
            }}
            title={`This Month: ${stats.timeDistribution.thisMonth} versions`}
          />
          <div
            className={styles.timeSegment}
            style={{
              width: formatPercentage(stats.timeDistribution.older, total),
              backgroundColor: '#9E9E9E',
            }}
            title={`Older: ${stats.timeDistribution.older} versions`}
          />
        </div>
        <div className={styles.timeLegend}>
          <span style={{ color: '#4CAF50' }}>Today</span>
          <span style={{ color: '#2196F3' }}>This Week</span>
          <span style={{ color: '#FFC107' }}>This Month</span>
          <span style={{ color: '#9E9E9E' }}>Older</span>
        </div>
      </div>
    );
  };

  const renderTopChanges = () => {
    const sortedChanges = Object.entries(stats.changeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div className={styles.topChanges}>
        {sortedChanges.map(([field, count]) => (
          <div key={field} className={styles.changeItem}>
            <span className={styles.field}>{field}</span>
            <span className={styles.count}>{count} changes</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTopTags = () => {
    const sortedTags = Object.entries(stats.tagUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div className={styles.topTags}>
        {sortedTags.map(([tag, count]) => (
          <div key={tag} className={styles.tagItem}>
            <span className={styles.tag}>{tag}</span>
            <span className={styles.count}>{count} uses</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3>Version Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.totalVersions}</span>
            <span className={styles.statLabel}>Total Versions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {stats.averageChangesPerVersion.toFixed(1)}
            </span>
            <span className={styles.statLabel}>Avg. Changes/Version</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.mostActiveAuthor}</span>
            <span className={styles.statLabel}>Most Active Author</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Time Distribution</h3>
        {renderTimeDistribution()}
      </div>

      <div className={styles.section}>
        <h3>Top Changed Fields</h3>
        {renderTopChanges()}
      </div>

      <div className={styles.section}>
        <h3>Most Used Tags</h3>
        {renderTopTags()}
      </div>
    </div>
  );
}; 