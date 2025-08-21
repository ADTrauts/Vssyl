import React from 'react';
import { Avatar } from 'shared/components';

export default function AvatarTest() {
  return (
    <div style={{ padding: 40, background: '#f8fafc' }}>
      <h2>Avatar Fallback Test (No src)</h2>
      <Avatar nameOrEmail="Andrew Trautman" size={64} />
    </div>
  );
} 