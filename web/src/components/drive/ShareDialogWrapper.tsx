'use client'

import React from 'react';
import ShareDialog from './ShareDialog';

const ShareDialogWrapper: React.FC = () => {
  // No need to pass props as the ShareDialog component
  // now gets everything it needs from the UI context directly
  return <ShareDialog />;
};

export default ShareDialogWrapper; 