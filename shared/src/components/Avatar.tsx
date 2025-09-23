"use client";

import React, { useEffect, useRef, useState } from 'react';

// Utility to get initials from name or email
function getInitials(nameOrEmail: string) {
  if (!nameOrEmail) return '?';
  
  let base = nameOrEmail;
  if (nameOrEmail.includes('@')) {
    base = nameOrEmail.split('@')[0];
  }
  
  const parts = base.split(/\s+|\./).filter(Boolean);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  
  return (first + last).toUpperCase();
}

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: number;
  nameOrEmail?: string; // for fallback initials
  className?: string;
  context?: 'personal' | 'business'; // Context for photo selection
  personalPhoto?: string | null;
  businessPhoto?: string | null;
};

export const Avatar: React.FC<AvatarProps & { forceTheme?: 'light' | 'dark' }> = ({ 
  src, 
  alt = '', 
  size = 40, 
  nameOrEmail, 
  className, 
  forceTheme,
  context = 'personal',
  personalPhoto,
  businessPhoto
}) => {
  const initials = getInitials(nameOrEmail || alt);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [imgError, setImgError] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      if (forceTheme) return forceTheme === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Determine which photo to use based on context
  const getContextualPhoto = () => {
    if (src) return src; // Explicit src takes precedence
    
    if (context === 'business' && businessPhoto) {
      return businessPhoto;
    }
    
    if (context === 'personal' && personalPhoto) {
      return personalPhoto;
    }
    
    // Fallback to the other context if current context doesn't have a photo
    if (context === 'business' && personalPhoto) {
      return personalPhoto;
    }
    
    if (context === 'personal' && businessPhoto) {
      return businessPhoto;
    }
    
    return null;
  };

  const photoSrc = getContextualPhoto();

  useEffect(() => {
    if (forceTheme) {
      setIsDark(forceTheme === 'dark');
      return;
    }
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [forceTheme]);

  const fallbackBg = isDark ? '#1f2937' : '#d1d5db'; // Tailwind bg-gray-800 or bg-gray-300
  const fallbackText = isDark ? '#f3f4f6' : '#111827'; // Tailwind text-gray-100 or text-gray-900
  const borderColor = isDark ? '#374151' : '#e5e7eb'; // Tailwind border-gray-700 or border-gray-200

  if (photoSrc && !imgError) {
    return (
      <img
        src={photoSrc}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${className || ''}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      ref={fallbackRef}
      className={`rounded-full flex items-center justify-center border ${className || ''}`}
      style={{
        width: size,
        height: size,
        background: `${fallbackBg} !important`,
        borderColor: `${borderColor} !important`,
      }}
      aria-label={alt}
    >
      <span
        ref={spanRef}
        className={`font-bold`}
        style={{
          fontSize: Math.max(size * 0.4, 12),
          color: `${fallbackText} !important`,
        }}
      >
        {initials}
      </span>
    </div>
  );
}; 