import React, { useState, useEffect } from 'react';

export const Slider = ({ min, max, value, disabled, onChange, step, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, onDoubleClick }) => {
  return (
    <input
      type="range"
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onDoubleClick={onDoubleClick}
      className="slider"
    />
  );
};

export const logSliderToLinear = (value) => {
    return Math.round((Math.log10(value) + 3) * 1000 / 3);
  };
  
const linearToLogSlider = (value) => {
    return Math.pow(10, (value * 3 / 1000) - 3);
};

export const LogarithmicSlider = ({ value, onChange, onDoubleClick, disabled = false }) => {
  const [sliderValue, setSliderValue] = useState(logSliderToLinear(value));
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(logSliderToLinear(value));
    }
  }, [value, isDragging]);

  const handleSliderChange = (newValue) => {
    setSliderValue(newValue);
    onChange(linearToLogSlider(newValue));
  };

  return (
      <Slider
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          disabled={disabled}
          onChange={e => handleSliderChange(e.target.value)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onDoubleClick={onDoubleClick}
      />
  );
}