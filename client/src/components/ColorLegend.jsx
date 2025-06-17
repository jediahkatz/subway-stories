import React from 'react';

const colorIntervalsForOriginDestination = [0, 10, 20, 50, 100, 200, 400, 800];
const colorIntervalsForAllStations = [50, 100, 200, 400, 800, 1600, 3200, 6400];
export const colorScale = [
  [250, 250, 240], // Light cream (keeping this as base)
  [240, 245, 220], // Very light green-cream
  [220, 235, 190], // Light pale green
  [200, 225, 160], // Soft light green
  [170, 210, 130], // Medium light green
  [140, 190, 100], // Medium green
  [110, 170, 70],  // Medium-dark green
  [80, 150, 40],   // Dark green
  [50, 120, 20],   // Deep green
];

export const getColorIntervals = (isAllStationsView) => isAllStationsView ? colorIntervalsForAllStations : colorIntervalsForOriginDestination

const ColorLegend = ({ allStationsView, style }) => {
  const intervals = getColorIntervals(allStationsView)
  return (
    <div className="color-legend" style={style}>
      <h3 className="legend-title">Hourly riders</h3>
      {intervals.map((interval, index) => (
        <div key={index} className="legend-item">
          <div 
            className="color-box" 
            style={{backgroundColor: `rgb(${colorScale[index].join(',')})`}}
          ></div>
          <span className="interval-label">
            {index === intervals.length - 1 
              ? `${interval}+` 
              : `${interval}-${intervals[index + 1]}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ColorLegend;
