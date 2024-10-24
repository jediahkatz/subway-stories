import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DataControls.css';

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
  return Math.round((Math.log10(value * 2) + 3) * 1000 / 3);
};
  
const linearToLogSlider = (value) => {
  return Math.pow(10, (value * 3 / 1000) - 3) / 2;
};

export const BarScaleSlider = ({ barScale, isLocked, setSelectedBarScale, disabled = false }) => {
  const HANDLE_WIDTH = 60;
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(logSliderToLinear(barScale));
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const resetBarScale = useCallback(() => {
    setSelectedBarScale(null);
  }, [setSelectedBarScale]);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(logSliderToLinear(barScale));
    }
  }, [barScale, isDragging]);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (rectRef.current) {
      const availableWidth = rectRef.current.width - HANDLE_WIDTH;
      
      const newValue = Math.max(0, Math.min(1000, Math.round((clientX - rectRef.current.left - (HANDLE_WIDTH / 2)) / availableWidth * 1000)));
      
      if (newValue !== localValue) {
        setLocalValue(newValue);
        setSelectedBarScale(linearToLogSlider(newValue));
      }
    }
  }, [localValue, setSelectedBarScale]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!disabled) {
      setIsDragging(true);
      if (sliderRef.current) {
        rectRef.current = sliderRef.current.getBoundingClientRect();
      }
      if (handleRef.current) {
        handleRef.current.setPointerCapture(e.pointerId);
      }
      updateSliderPosition(e.clientX);
    }
  }, [disabled, updateSliderPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    rectRef.current = null;
    if (handleRef.current) {
      handleRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  }, [isDragging, updateSliderPosition]);

  const getDisplayValue = useCallback(() => {
    const logValue = linearToLogSlider(localValue);
    // For friendly display, remap 0.0005x - 0.5x to 0.01x - 10x
    const friendlyScaleLogValue = Math.min(logValue * 10 * 2, 10);
    return friendlyScaleLogValue === 10 ? '10.0x' : friendlyScaleLogValue.toFixed(2) + 'x';
  }, [localValue]);

  const getHandlePosition = useCallback(() => {
    // Calculate position in pixels
    const trackWidth = sliderRef.current ? sliderRef.current.getBoundingClientRect().width : 250; // fallback to 250 if not available
    const availableWidth = trackWidth - HANDLE_WIDTH;
    const position = (HANDLE_WIDTH / 2) + (localValue / 1000) * availableWidth;
    return `${position}px`;
  }, [localValue]);

  const handleLockClick = useCallback(() => {
    if (isLocked) {
      resetBarScale();
    } else {
      setSelectedBarScale(barScale);
    }
  }, [isLocked, resetBarScale, setSelectedBarScale, barScale]);

  return (
    <div className="logarithmic-slider-container">
      <div
        ref={sliderRef}
        className={`logarithmic-slider ${disabled ? 'disabled' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onDoubleClick={resetBarScale}
      >
        <div
          ref={handleRef}
          className="slider-handle"
          style={{ left: getHandlePosition() }}
        >
          <div className="handle-value">{getDisplayValue()}</div>
        </div>
      </div>
      <button className={`slider-lock-button ${isLocked ? 'locked' : ''}`} onClick={handleLockClick}>
        {!isLocked && <span className="auto-text">AUTO</span>}
      </button>
    </div>
  );
};
// Inspired by https://www.facebook.com/share/v/bv5vsJQgVs5aKgUG/
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
