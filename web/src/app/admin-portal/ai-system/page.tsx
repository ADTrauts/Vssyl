import { redirect } from 'next/navigation';

/** Legacy AI System launcher — canonical destination is AI Pipeline (Wave 0). */
export default function AiSystemRedirect() {
  redirect('/admin-portal/ai-pipeline');
}
