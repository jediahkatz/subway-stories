import React, { useState, useEffect } from 'react';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MonthSelector = ({ initialSelectedMonths, onMonthsChange }) => {
  const [localSelectedMonths, setLocalSelectedMonths] = useState(initialSelectedMonths);

  useEffect(() => {
    setLocalSelectedMonths(initialSelectedMonths);
  }, [initialSelectedMonths]);

  const handleMonthToggle = (index) => {
    const newSelectedMonths = localSelectedMonths.includes(index)
      ? localSelectedMonths.filter(m => m !== index)
      : [...localSelectedMonths, index].sort((a, b) => a - b);
    setLocalSelectedMonths(newSelectedMonths);
    onMonthsChange(newSelectedMonths);
  };

  return (
    <div className="month-selector">
      {months.map((month, index) => (
        <button
          key={month}
          className={`month-button ${localSelectedMonths.includes(index) ? 'selected' : ''}`}
          onClick={() => handleMonthToggle(index)}
        >
          {month}
        </button>
      ))}
    </div>
  );
};

export default MonthSelector;