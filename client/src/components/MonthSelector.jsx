import React, { useState, useEffect } from 'react';
import { useDebounce } from '../lib/debounce';

const biMonthlyPeriods = [
  'Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'
];

const BiMonthlySelector = ({ initialSelectedPeriods, onPeriodsChange }) => {
  const [localSelectedPeriods, setLocalSelectedPeriods] = useState(initialSelectedPeriods);
  const [isDragging, setIsDragging] = useState(false);
  const [lastToggledPeriod, setLastToggledPeriod] = useState(null);

  useEffect(() => {
    setLocalSelectedPeriods(initialSelectedPeriods);
  }, [initialSelectedPeriods]);

  const getNewSelectedPeriods = (prevSelected, index) => {
    return prevSelected.includes(index)
      ? prevSelected.filter(p => p !== index)
      : [...prevSelected, index].sort((a, b) => a - b);
  };

  const debouncedOnPeriodsChange = useDebounce(onPeriodsChange, 1000);

  const handleMouseDown = (index) => {
    setIsDragging(true);
    setLastToggledPeriod(index);
    setLocalSelectedPeriods(selectedPeriods => {
      const newSelectedPeriods = getNewSelectedPeriods(selectedPeriods, index);
      debouncedOnPeriodsChange(newSelectedPeriods);
      return newSelectedPeriods;
    });
  };

  const handleMouseEnter = (index) => {
    if (isDragging && lastToggledPeriod !== index) {
      setLastToggledPeriod(index);
      setLocalSelectedPeriods(selectedPeriods => {
        const newSelectedPeriods = getNewSelectedPeriods(selectedPeriods, index);
        debouncedOnPeriodsChange(newSelectedPeriods);
        return newSelectedPeriods;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastToggledPeriod(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [localSelectedPeriods]);

  return (
    <div className="bimonthly-selector">
      {biMonthlyPeriods.map((period, index) => (
        <button
          key={period}
          className={`period-button ${localSelectedPeriods.includes(index) ? 'selected' : ''}`}
          onMouseDown={() => handleMouseDown(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        >
          {period}
        </button>
      ))}
    </div>
  );
};

export default BiMonthlySelector;
