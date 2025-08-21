import React from 'react';

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox: React.FC<CheckboxProps> = (props) => (
  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 focus:ring focus:ring-blue-400" {...props} />
); 