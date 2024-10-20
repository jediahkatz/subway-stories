import React, { useState } from 'react';

const AttributedPhoto = ({ src, alt, attribution }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="attributed-photo"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt} className="story-image" />
      {isHovered && attribution && (
        <div className="photo-attribution">
          {attribution}
        </div>
      )}
    </div>
  );
};

export default AttributedPhoto;