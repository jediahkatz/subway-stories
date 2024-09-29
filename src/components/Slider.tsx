import React from 'react';

const Slider = ({ min, max, value, disabled, onChange }) => {
  return (
    <input
      type="range"
      disabled={disabled}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="slider"
    />
  );
};

export default Slider;