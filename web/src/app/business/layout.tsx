import BusinessLayoutClient from '../../components/business/BusinessLayoutClient';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessLayoutClient>{children}</BusinessLayoutClient>;
} 