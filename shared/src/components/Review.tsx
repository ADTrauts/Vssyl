import React from 'react';
import { Rating } from './Rating';

type ReviewProps = {
  author: string;
  rating: number;
  text: string;
  date: string;
};

export const Review: React.FC<ReviewProps> = ({ author, rating, text, date }) => (
  <div className="bg-gray-50 border rounded p-3 mb-2">
    <div className="flex items-center gap-2 mb-1">
      <span className="font-semibold text-sm">{author}</span>
      <Rating value={rating} readOnly />
      <span className="text-xs text-gray-400 ml-auto">{date}</span>
    </div>
    <div className="text-gray-700 text-sm">{text}</div>
  </div>
); 