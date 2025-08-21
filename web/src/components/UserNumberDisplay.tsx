"use client";

import React, { useState } from 'react';

interface UserNumberDisplayProps {
  userNumber: string;
  showLabel?: boolean;
  className?: string;
}

export default function UserNumberDisplay({ 
  userNumber, 
  showLabel = true, 
  className = "" 
}: UserNumberDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!userNumber) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">Block ID:</span>
      )}
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
        {userNumber}
      </span>
      <button
        onClick={copyToClipboard}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        title="Copy Block ID"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
} 