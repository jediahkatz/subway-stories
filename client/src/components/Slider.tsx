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
  const handleRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const updateSliderPosition = useCallback((clientX: number, localValue: number, onChange: (value: number) => void) => {
    if (rectRef.current) {
      const newValue = Math.max(0, Math.min(23, Math.floor((clientX - rectRef.current.left) / (rectRef.current.width / 24))));
      if (newValue !== localValue) {
        setLocalValue(newValue);
        onChange(newValue);
      }
    }
  }, []);


  const handleDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);    
    if (sliderRef.current) {
      rectRef.current = sliderRef.current.getBoundingClientRect();
    }
    if (handleRef.current) {
      handleRef.current.setPointerCapture(e.pointerId);
    }
    updateSliderPosition(e.clientX, localValue, onChange);
  }, [localValue, onChange]);

  const handleDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    rectRef.current = null;
    if (handleRef.current) {
      handleRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSliderPosition(e.clientX, localValue, onChange);
    }
  }, [isDragging, onChange, localValue]);

  const formatTime = useCallback((hour: number) => {
    const period = hour < 12 ? 'a.m.' : 'p.m.';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  }, []);

  const TICK_WIDTH = 3;

  const calculateHandlePosition = useCallback(() => {
    if (sliderRef.current) {
      const sliderWidth = sliderRef.current.clientWidth - TICK_WIDTH;
      const stepWidth = sliderWidth / 23;
      return (TICK_WIDTH / 2) + (localValue * stepWidth);
    }
    return 0;
  }, [localValue]);

  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.style.left = `${calculateHandlePosition()}px`;
    }
  }, [localValue, calculateHandlePosition]);

  return (
    <div
      ref={sliderRef}
      className="cool-slider"
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onPointerMove={handlePointerMove}
    >
      <div className="tick-marks">
        {Array.from({ length: 24 }, (_, i) => {
          const adjacentClass = 
            i === localValue ? 'equal' :
            Math.abs(i - localValue) === 1 ? 'adjacent' :
            Math.abs(i - localValue) === 2 ? 'adjacent2' :  
                                             '';
          return (
            <div
              key={i}
              className={`tick-mark ${adjacentClass} ${isDragging ? 'growing' : ''}`}
            />
          );
        })}
      </div>
      <div
        ref={handleRef}
        className={`handle ${isDragging ? 'dragging' : ''}`}
      >
        <div className="time-display">{formatTime(localValue)}</div>
      </div>
    </div>
  );
};
