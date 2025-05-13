'use client'

import React from 'react';
import RenameDialog from './RenameDialog';

const RenameDialogWrapper: React.FC = () => {
  // TODO: Replace these with real values from context or parent
  return (
    <RenameDialog
      isOpen={false}
      initialName=""
      onRename={() => {}}
      onClose={() => {}}
    />
  );
};

export default RenameDialogWrapper; 