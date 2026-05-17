import { BusinessConfigurationProvider } from '@/contexts/BusinessConfigurationContext';
import { BusinessLayoutRuntimeShell } from '@/runtime/workspace/BusinessLayoutRuntimeShell';

export default function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <BusinessConfigurationProvider businessId={params.id}>
      <BusinessLayoutRuntimeShell businessId={params.id}>{children}</BusinessLayoutRuntimeShell>
    </BusinessConfigurationProvider>
  );
}
