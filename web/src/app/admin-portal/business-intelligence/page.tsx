import { redirect } from 'next/navigation';
import { ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH } from '../../../lib/adminAnalyticsOwnership';

/** Legacy BI surface — consolidated into Platform Analytics insights tab (Stage 0C, AP-F-007). */
export default function BusinessIntelligenceRedirect() {
  redirect(ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH);
}
