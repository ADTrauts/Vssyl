import { redirect } from 'next/navigation';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy context debug UI — redirected to AI Pipeline diagnostics (Package 0D-F). */
export default async function AiContextRedirect({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const mapped = new URLSearchParams();

  const userId = typeof params.userId === 'string' ? params.userId : undefined;
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : undefined;
  const traceId = typeof params.traceId === 'string' ? params.traceId : undefined;

  if (traceId) {
    mapped.set('traceId', traceId);
  } else if (sessionId) {
    mapped.set('traceId', sessionId);
  }
  if (userId) {
    mapped.set('userId', userId);
  }

  const qs = mapped.toString();
  redirect(`/admin-portal/ai-pipeline/diagnostics${qs ? `?${qs}` : ''}`);
}
