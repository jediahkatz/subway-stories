import React, { useState, useEffect } from 'react';
import { useDebounce } from '../lib/debounce';

const weekdays = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
];

const WeekdaySelector = ({ initialSelectedWeekdays, onWeekdaysChange }) => {
  const [localSelectedWeekdays, setLocalSelectedWeekdays] = useState(initialSelectedWeekdays);
  const [isDragging, setIsDragging] = useState(false);
  const [lastToggledWeekday, setLastToggledWeekday] = useState(null);

  useEffect(() => {
    setLocalSelectedWeekdays(initialSelectedWeekdays);
  }, [initialSelectedWeekdays]);

  const getNewSelectedWeekdays = (prevSelected, index) => {
    return prevSelected.includes(index)
      ? prevSelected.filter(w => w !== index)
      : [...prevSelected, index].sort((a, b) => a - b);
  };

  const debouncedOnWeekdaysChange = useDebounce(onWeekdaysChange, 1000);

  const handleMouseDown = (index) => {
    setIsDragging(true);
    setLastToggledWeekday(index);
    setLocalSelectedWeekdays(selectedWeekdays => {
      const newSelectedWeekdays = getNewSelectedWeekdays(selectedWeekdays, index);
      debouncedOnWeekdaysChange(newSelectedWeekdays);
      return newSelectedWeekdays;
    });
  };

  const handleMouseEnter = (index) => {
    if (isDragging && lastToggledWeekday !== index) {
      setLastToggledWeekday(index);
      setLocalSelectedWeekdays(selectedWeekdays => {
        const newSelectedWeekdays = getNewSelectedWeekdays(selectedWeekdays, index);
        debouncedOnWeekdaysChange(newSelectedWeekdays);
        return newSelectedWeekdays;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastToggledWeekday(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [localSelectedWeekdays]);

  return (
    <div className="weekday-selector">
      {weekdays.map((weekday, index) => (
        <button
          key={weekday}
          className={`weekday-button ${localSelectedWeekdays.includes(index) ? 'selected' : ''}`}
          onMouseDown={() => handleMouseDown(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        >
          {weekday}
        </button>
      ))}
    </div>
  );
};

export default WeekdaySelector;
