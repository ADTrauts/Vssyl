import React from 'react';

type RatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

export const Rating: React.FC<RatingProps> = ({ value, onChange, readOnly }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} ${readOnly ? 'cursor-default' : 'hover:text-yellow-500'}`}
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          aria-label={`Rate ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}; 