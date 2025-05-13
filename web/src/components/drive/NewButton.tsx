import React from 'react'

interface NewButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const NewButton: React.FC<NewButtonProps> = ({ onClick, label = 'New', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {label}
    </button>
  )
}

export default NewButton; 