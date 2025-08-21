import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, actions, className }) => (
  <section className={className} style={{ marginBottom: 32 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h2>
      {actions && <div>{actions}</div>}
    </div>
    <div>{children}</div>
  </section>
);

export default Section; 