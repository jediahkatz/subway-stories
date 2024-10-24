import React, { useState } from 'react';
import { stationIdToStation, stations } from '../lib/stations';
import { Slider, BarScaleSlider, CoolSlider } from './Slider';
import MonthSelector from './MonthSelector';
import { SearchableStringDropdown, SearchableStationDropdown } from './SearchableDropdown';
import './DataControls.css';
import { ALL_STATIONS_ID, ALL_STATIONS_OBJECT } from '../lib/all-stations';
import { Tooltip } from './Tooltip';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const sortedStations = [
  ALL_STATIONS_OBJECT,
  ...stations.sort((a, b) => a.display_name.localeCompare(b.display_name))
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
  barScaleLocked,
  barScale,
  setSelectedBarScale,
  selectedMonths,
  setSelectedMonths,
  showPercentage,
  setShowPercentage,
  setInfoTooltipInfo
}) => {
  const [showMoreControls, setShowMoreControls] = useState(false);

  const handleInfoIconMouseEnter = (event) => {
    const INFO_TOOLTOP_HEIGHT = 104
    const rect = event.target.getBoundingClientRect();
    setInfoTooltipInfo({ x: rect.left + 16, y: rect.top + INFO_TOOLTOP_HEIGHT / 2 - 6 });
  };

  const handleInfoIconMouseLeave = () => {
    setInfoTooltipInfo(null);
  };

  return (
    <div className="map-controls">
      <label htmlFor="day-selector">
        <p className="map-controls-label">Day</p>
        <SearchableStringDropdown
          options={daysOfWeek}
          id="day-selector"
          selectedVal={selectedDay}
          handleChange={(day) => setSelectedDay(day)}
        />
      </label>
      <div className="hour-control">
        <label>
          <p className="map-controls-label">Hour</p>
        </label>
        <div className="slider-container">
          <CoolSlider
            min={0}
            max={23}
            value={selectedHour}
            onChange={newValue => setSelectedHour(newValue, selectedHour) }
          />
        </div>
      </div>
      <label htmlFor="ridership-controls">
        <p className="map-controls-label">Ridership</p>
        <div id="ridership-controls">
          <div id="direction-selector" className={`direction-selector ${selectedDirection === 'goingTo' ? 'going-to' : ''}`}>
              <button 
                className={`direction-button ${selectedDirection === 'comingFrom' ? 'active' : ''}`}
                onClick={() => setSelectedDirection('comingFrom')}
              >
                Arriving at
              </button>
              <button 
                className={`direction-button ${selectedDirection === 'goingTo' ? 'active' : ''}`}
                onClick={() => setSelectedDirection('goingTo')}
              >
                Departing from
              </button>
          </div>
          <SearchableStationDropdown 
            options={sortedStations}
            label="display_name"
            id="station-selector"
            selectedVal={selectedStation === ALL_STATIONS_ID ? ALL_STATIONS_OBJECT : stationIdToStation[selectedStation]}
            handleChange={(station) => setSelectedStation(station.complex_id)}
          />
        </div>
      </label>
      {showMoreControls && (
        <>
          <label htmlFor="month-selector">
            <p className="map-controls-label">Months</p>
            <MonthSelector initialSelectedMonths={selectedMonths} onMonthsChange={setSelectedMonths} />
          </label>
          <div className="bar-scale-control">
            <label>
              <p className="map-controls-label">
                Bar scale
                <span 
                  className="info-icon" 
                  onMouseEnter={handleInfoIconMouseEnter}
                  onMouseLeave={handleInfoIconMouseLeave}
                />
              </p>
            </label>
            <div className="slider-container">
              <BarScaleSlider
                isLocked={barScaleLocked}
                barScale={barScale}
                setSelectedBarScale={setSelectedBarScale}
              />
            </div>
          </div>
        </>
      )}
      
      <div 
        className="see-more" 
        onClick={() => setShowMoreControls(!showMoreControls)}
      >
        {showMoreControls ? 'Show less' : 'More controls'}
        <div className="arrow-wrapper">
          <div className={`arrow ${showMoreControls ? 'open' : ''}`}></div>
        </div>
      </div>
    </div>
  );
};
export default DataControls;
