import React from 'react';

const Slider = ({ min, max, value, onChange }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="slider"
    />
  );
};

export default Slider;