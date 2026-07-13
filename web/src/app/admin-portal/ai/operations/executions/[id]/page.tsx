import { redirect } from 'next/navigation';

export default async function Redirect({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  redirect(`/admin-portal/ai-pipeline/executions/${resolved.id}`);
}
