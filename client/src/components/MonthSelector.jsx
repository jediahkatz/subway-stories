import React, { useState, useEffect } from 'react';

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

  const handleMonthToggle = (index) => {
    setLocalSelectedMonths(prevSelected => {
      const newSelectedMonths = prevSelected.includes(index)
        ? prevSelected.filter(m => m !== index)
        : [...prevSelected, index].sort((a, b) => a - b);
      return newSelectedMonths;
    });
  };

  const handleMouseDown = (index) => {
    setIsDragging(true);
    setLastToggledMonth(index);
    handleMonthToggle(index);
  };

  const handleMouseEnter = (index) => {
    if (isDragging && lastToggledMonth !== index) {
      handleMonthToggle(index);
      setLastToggledMonth(index);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastToggledMonth(null);
    onMonthsChange(localSelectedMonths);
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
