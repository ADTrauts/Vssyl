import { BusinessConfigurationProvider } from '@/contexts/BusinessConfigurationContext';

export default function BusinessLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: { id: string } 
}) {
  return (
    <BusinessConfigurationProvider businessId={params.id}>
      {children}
    </BusinessConfigurationProvider>
  );
}
