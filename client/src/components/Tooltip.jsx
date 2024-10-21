import React, { useEffect, useState } from 'react';
import { SubwayLineSymbol } from './SubwayLineSymbol';

const Tooltip = ({ x, y, children }) => {
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    const updatePosition = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth - x < 310) {
        setPosition({ right: windowWidth - x, top: y });
      } else {
        setPosition({ left: x, top: y });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => window.removeEventListener('resize', updatePosition);
  }, [x, y]);

  return (
    <div className="tooltip" style={position}>
      {children}
    </div>
  );
};

const RidershipTooltip = ({ x, y, stationName, ridership, ridershipLabel, percentage, percentageLabel }) => {
  const getStationNameAndLines = (fullName) => {
    const containsLines = fullName.includes('(');
    if (!containsLines) {
      return { name: fullName, lines: [] };
    }
    const name = fullName.slice(0, fullName.lastIndexOf('(')).trim();
    const lines = fullName.slice(fullName.lastIndexOf('(') + 1, fullName.lastIndexOf(')')).split(' ') || [];
    return { name, lines };
  };

  const { name, lines } = getStationNameAndLines(stationName);

  return (
    <Tooltip x={x} y={y}>
      <div className="tooltip-header">{name}</div>
      <div className="station-lines">
        {lines.map((line, index) => (
          <SubwayLineSymbol key={index} line={line} />
        ))}
      </div>
      <div className="ridership-tooltip-content">
        <div>{ridershipLabel || 'Ridership'}: {Math.round(ridership).toLocaleString()}</div>
        {percentage && <div>({percentage.toFixed(2)}{percentageLabel})</div>}
      </div>
    </Tooltip>
  );
};

export { RidershipTooltip, Tooltip };
