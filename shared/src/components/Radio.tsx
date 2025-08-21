import React from 'react';

type RadioProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Radio: React.FC<RadioProps> = (props) => (
  <input type="radio" className="form-radio h-4 w-4 text-blue-600" {...props} />
); 