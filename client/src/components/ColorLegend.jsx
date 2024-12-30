import React from 'react';

const colorIntervalsForOriginDestination = [0, 10, 20, 50, 100, 200, 400, 800];
const colorIntervalsForAllStations = [50, 100, 200, 400, 800, 1600, 3200, 6400];
export const colorScale = [
  [250, 250, 240], // Light cream
  [240, 220, 200], // Very light tan
  [230, 200, 170], // Light beige
  [220, 180, 150], // Soft tan
  [210, 140, 110], // Warm orange-beige
  [200, 100, 80],  // Muted orange
  [180, 60, 50],   // Deep orange-red
  // [140, 40, 30],   // Brick red
  [170, 20, 20],
  [220, 10, 10],
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
