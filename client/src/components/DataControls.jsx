import React, { useState, useCallback } from 'react';
import { stations } from '../lib/stations';
import { Slider, LogarithmicSlider } from './Slider';
import MonthSelector from './MonthSelector';
import { useDebounce } from '../lib/debounce';

const ANIMATE_HOUR_PERIOD = 500

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]; 

const DataControls = ({ 
  selectedHour, 
  setSelectedHour, 
  selectedDay, 
  setSelectedDay, 
  selectedStation, 
  setSelectedStation, 
  selectedDirection, 
  setSelectedDirection,
  barScale,
  setSelectedBarScale,
  selectedMonths, 
  setSelectedMonths,
  showPercentage,
  setShowPercentage
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const debouncedSetSelectedMonths = useDebounce(setSelectedMonths, 1000);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  React.useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setSelectedHour(prevHour => (prevHour + 1) % 24, selectedHour);
      }, ANIMATE_HOUR_PERIOD);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, setSelectedHour, selectedHour]);

  // horrible ai generated code but works
  const handleMonthToggle = (monthIndex) => {
    debouncedSetSelectedMonths(prev => {
      if (prev.includes(monthIndex)) {
        return prev.filter(m => m !== monthIndex);
      } else {
        return [...prev, monthIndex].sort((a, b) => a - b);
      }
    });
  };

  return (
    <div className="map-controls">
      <MonthSelector initialSelectedMonths={selectedMonths} onMonthsChange={debouncedSetSelectedMonths} />
      <label>
        Select day:
        <select
          value={selectedDay}
          onChange={e => setSelectedDay(e.target.value)}
        >
          {daysOfWeek.map(day => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </label>
      <div className="hour-control">
        <label>
          Select hour: {selectedHour}:00
        </label>
        <div className="slider-container">
          <Slider
            min={0}
            max={23}
            disabled={isPlaying}
            value={selectedHour}
            onChange={e => setSelectedHour(Number(e.target.value), selectedHour)}
          />
          <button onClick={togglePlay} className="play-button">
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
      <label>
        Select station:
        <select
          value={selectedStation}
          onChange={e => setSelectedStation(e.target.value)}
        >
          {stations.sort((a, b) => a.display_name.localeCompare(b.display_name)).map(station => (
            <option key={station.complex_id} value={station.complex_id}>
              {station.display_name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Direction: Where are they...
        <select
          value={selectedDirection}
          onChange={e => setSelectedDirection(e.target.value)}
        >
          <option value="goingTo">Going to</option>
          <option value="comingFrom">Coming from</option>
        </select>
      </label>
      <div className="bar-scale-control">
        <label>
          Bar height (double-click to reset):
        </label>
        <div className="slider-container">
          <LogarithmicSlider
            value={barScale}
            onChange={setSelectedBarScale}
            // Unlocks the bar scale
            onDoubleClick={() => setSelectedBarScale(null)}
          />
          <span>{barScale.toFixed(3)}x</span>
        </div>
      </div>
      <label className="inline-checkbox">
        <input
          type="checkbox"
          checked={showPercentage}
          onChange={(e) => setShowPercentage(e.target.checked)}
        />
        <span>Show percentage of ridership</span>
      </label>
    </div>
  );
};
export default DataControls;
