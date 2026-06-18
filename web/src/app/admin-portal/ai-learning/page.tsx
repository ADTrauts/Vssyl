import { redirect } from 'next/navigation';

/** Legacy centralized-ai admin UI — redirected to canonical AI Pipeline (Package 0D-B). */
export default function AiLearningRedirect() {
  redirect('/admin-portal/ai-pipeline');
}
