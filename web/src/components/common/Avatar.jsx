'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Avatar({ user, size = 'md', editable = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    return avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${avatarUrl}`;
  };

  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {avatarUrl && !imageError ? (
        <Image
          src={avatarUrl}
          alt={user?.name || 'User avatar'}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes={`(max-width: 768px) ${size === 'sm' ? '32px' : size === 'md' ? '40px' : '48px'}`}
        />
      ) : (
        <span className="text-gray-600 font-medium">
          {getInitials(user?.name)}
        </span>
      )}
      
      {editable && isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs">Change</span>
        </div>
      )}
    </div>
  );
} 