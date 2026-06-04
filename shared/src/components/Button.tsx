"use client";

import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
  },
  ref
) {
  const base =
    'font-semibold v-focus-ring focus:outline-none focus:ring-2 focus:ring-v-primary rounded-v-button';

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-v-primary text-white hover:bg-v-primary-hover',
    secondary: 'bg-v-surface-muted text-v-text-primary hover:bg-v-border-strong',
    ghost: 'bg-transparent text-v-text-secondary hover:bg-v-surface-muted',
  };

  const styles = `${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <button ref={ref} className={styles} {...props}>
      {children}
    </button>
  );
});
