// src/components/Tooltip.js
import React from 'react';

const Tooltip = ({ x, y, stationName, ridership }) => {
  const style = {
    position: 'absolute',
    top: y,
    left: x,
    backgroundColor: 'white',
    padding: '5px 10px',
    borderRadius: '5px',
    boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return (
    <div style={style}>
      <strong>{stationName}</strong>
      <br />
      Ridership: {ridership}
    </div>
  );
};

export default Tooltip;
