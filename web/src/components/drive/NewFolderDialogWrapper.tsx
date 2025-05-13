import React from 'react'

interface NewFolderDialogWrapperProps {
  children: React.ReactNode;
}

const NewFolderDialogWrapper: React.FC<NewFolderDialogWrapperProps> = ({ children }) => {
  return <div className="new-folder-dialog-wrapper">{children}</div>
}

export default NewFolderDialogWrapper; 