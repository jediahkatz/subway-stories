import React from 'react';
import './FloatingInfoBar.css';

interface FloatingInfoBarProps {
  formatInfoBarText: (args: {
    direction: string,
    stationId: string,
    hour: number,
    day: string,
    selectedMonths: number[],
    animatingField?: string
  }) => React.ReactNode;
  direction: string;
  stationId: string;
  hour: number;
  day: string;
  selectedMonths: number[];
  animation: { field: string } | null;
  visible?: boolean;
}

const FloatingInfoBar: React.FC<FloatingInfoBarProps> = ({
  formatInfoBarText,
  direction,
  stationId,
  hour,
  day,
  selectedMonths,
  animation,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div className="floating-info-bar">
      <p>
        {formatInfoBarText({ direction, stationId, hour, day, selectedMonths, animatingField: animation?.field })}
      </p>
    </div>
  );
};

export default FloatingInfoBar; 