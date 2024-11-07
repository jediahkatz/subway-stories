import React from 'react';

export const colorIntervals = [0, 10, 20, 40, 80, 160, 320, 640, 1280, 5120];
export const colorScale = [
  [255, 255, 240], // Light cream
  [240, 220, 200], // Very light tan
  [230, 200, 170], // Light beige
  [220, 180, 150], // Soft tan
  [210, 140, 110], // Warm orange-beige
  [200, 100, 80],  // Muted orange
  [180, 60, 50],   // Deep orange-red
  [140, 40, 30],   // Brick red
  [150, 20, 20],
  [220, 20, 20],
];

const ColorLegend = ({ showFinalColor }) => {
  const intervals = showFinalColor ? colorIntervals : colorIntervals.slice(0, -1);
  return (
    <div className="color-legend">
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
