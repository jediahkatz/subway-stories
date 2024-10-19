import React, { useState, useEffect } from 'react';
import { useDebounce } from '../lib/debounce';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MonthSelector = ({ initialSelectedMonths, onMonthsChange }) => {
  const [localSelectedMonths, setLocalSelectedMonths] = useState(initialSelectedMonths);
  const [isDragging, setIsDragging] = useState(false);
  const [lastToggledMonth, setLastToggledMonth] = useState(null);

  useEffect(() => {
    setLocalSelectedMonths(initialSelectedMonths);
  }, [initialSelectedMonths]);

  const getNewSelectedMonths = (prevSelected, index) => {
    return prevSelected.includes(index)
      ? prevSelected.filter(m => m !== index)
      : [...prevSelected, index].sort((a, b) => a - b);
  };

  const debouncedOnMonthsChange = useDebounce(onMonthsChange, 1000);

  const handleMouseDown = (index) => {
    setIsDragging(true);
    setLastToggledMonth(index);
    setLocalSelectedMonths(selectedMonths => {
      const newSelectedMonths = getNewSelectedMonths(selectedMonths, index);
      debouncedOnMonthsChange(newSelectedMonths);
      return newSelectedMonths;
    });
  };

  const handleMouseEnter = (index) => {
    if (isDragging && lastToggledMonth !== index) {
      setLastToggledMonth(index);
      setLocalSelectedMonths(selectedMonths => {
        const newSelectedMonths = getNewSelectedMonths(selectedMonths, index);
        debouncedOnMonthsChange(newSelectedMonths);
        return newSelectedMonths;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastToggledMonth(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [localSelectedMonths]);

  return (
    <div className="month-selector">
      {months.map((month, index) => (
        <button
          key={month}
          className={`month-button ${localSelectedMonths.includes(index) ? 'selected' : ''}`}
          onMouseDown={() => handleMouseDown(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        >
          {month}
        </button>
      ))}
    </div>
  );
};

export default MonthSelector;
