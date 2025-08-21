import React from 'react';

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({ label, children, error, help, className }) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
    <label style={{ fontWeight: 500, marginBottom: 2 }}>{label}</label>
    {children}
    {help && <div style={{ color: '#888', fontSize: 13 }}>{help}</div>}
    {error && <div style={{ color: 'red', fontSize: 13, fontWeight: 500 }}>{error}</div>}
  </div>
);

export default FormGroup; 