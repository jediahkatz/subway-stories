import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CoolSlider.css';

export const Slider = ({ min, max, value, disabled, onChange, step, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, onDoubleClick }: {
  min: number;
  max: number;
  value: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onDoubleClick?: () => void;
}) => {
  return (
    <input
      type="range"
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
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
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onDoubleClick={onDoubleClick}
      />
  );
}

export const CoolSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);


  const handleMouseDown = useCallback(() => {
    // setLocalValue(localValue + 1);
    // onChange(localValue + 1);
    setIsDragging(true);
    if (sliderRef.current) {
      rectRef.current = sliderRef.current.getBoundingClientRect();
    }
  }, [localValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    rectRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && rectRef.current) {
      console.log('handleMouseMove!')
      const newValue = Math.max(0, Math.min(23, Math.floor((e.clientX - rectRef.current.left) / (rectRef.current.width / 24))));
      setLocalValue(newValue);
      onChange(newValue);
    }
  }, [isDragging, onChange]);

  const formatTime = useCallback((hour: number) => {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${period}`;
  }, []);

  // const tickMarks = useMemo(() => 
  //   Array.from({ length: 24 }, (_, i) => (
  //     <div
  //       key={i}
  //       className={`tick-mark ${Math.abs(i - localValue) <= 1 ? 'adjacent' : ''}`}
  //       data-index={i}
  //     />
  //   ))
  // , [localValue]);

  return (
    <>
    <Slider min={0} max={23} value={localValue} onChange={onChange} step={1} onDoubleClick={handleMouseDown} />
    {/* <div 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', height: '10px', backgroundColor: 'red' }}
      onDoubleClick={handleMouseDown}
    /> */}
    <div
      ref={sliderRef}
      className="cool-slider"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="tick-marks">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className={`tick-mark ${Math.abs(i - localValue) <= 1 ? 'adjacent' : ''} ${isDragging ? 'growing' : ''}`}
          />
        ))}
      </div>
      <div
        className={`handle ${isDragging ? 'dragging' : ''}`}
        style={{ left: `${(localValue / 23) * 100}%` }}
      >
        <div className="time-display">{formatTime(localValue)}</div>
      </div>
    </div>
    </>
  );
};
