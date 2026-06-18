export function formatDashboardSystemHealth(
  systemHealth: number | null | undefined,
  systemHealthStatus?: 'available' | 'unavailable',
): string {
  if (systemHealthStatus === 'unavailable' || systemHealth == null) {
    return 'Unavailable';
  }

  return `${systemHealth}%`;
}
