import { redirect } from 'next/navigation';

/** Phase 4B: AI Operations Center merged into canonical AI Pipeline Hub. */
export default function AiOperationsRedirect() {
  redirect('/admin-portal/ai-pipeline');
}
