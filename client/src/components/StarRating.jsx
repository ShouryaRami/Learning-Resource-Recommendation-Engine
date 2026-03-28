import { useState } from 'react';

const StarRating = ({ rating, onRate, readonly = false }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg leading-none ${!readonly ? 'cursor-pointer' : ''} ${
            star <= (hovered ?? rating) ? 'text-yellow-400' : 'text-gray-300'
          }`}
          onMouseEnter={!readonly ? () => setHovered(star) : undefined}
          onMouseLeave={!readonly ? () => setHovered(null) : undefined}
          onClick={!readonly ? () => onRate(star) : undefined}
        >
          {star <= (hovered ?? rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

export default StarRating;
