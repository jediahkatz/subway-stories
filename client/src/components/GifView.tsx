import React, { useEffect } from 'react';
import { gifDataview } from '../data/gif-dataview';
import FloatingInfoBar from './FloatingInfoBar';
import { formatInfoBarText } from '../components/StoriesView';
import { trackEvent } from '../lib/analytics';

interface GifViewProps {
  handleDataSettingsChange: (settings: any) => Promise<void>;
  setViewport: (viewportUpdate: any) => void;
  limitVisibleLines: (lines: string[] | null) => void;
  selectedDirection: string;
  selectedStation: string;
  selectedHour: number;
  selectedDay: string;
  selectedMonths: number[];
  animation: { field: string } | null;
  setAnimation: (animation: any) => void;
  onExit: () => void;
}

const GifView: React.FC<GifViewProps> = ({
  handleDataSettingsChange,
  setViewport,
  limitVisibleLines,
  selectedDirection,
  selectedStation,
  selectedHour,
  selectedDay,
  selectedMonths,
  animation,
  setAnimation,
  onExit,
}) => {
  // Setup effect - runs once when entering GIF mode
  useEffect(() => {
    const setup = async () => {
      // Hide mapbox controls
      document.querySelectorAll('.mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left')
        .forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.visibility = 'hidden';
          }
        });

      // Apply the dataview settings
      await handleDataSettingsChange({
        newSelectedStation: gifDataview.station,
        newSelectedDirection: gifDataview.direction,
        newSelectedDay: gifDataview.day,
        newSelectedHour: gifDataview.hour,
        newSelectedMonths: gifDataview.months,
        newSelectedBarScale: gifDataview.barScale,
      });

      // Set animation after data settings are applied
      if (gifDataview.animate) {
        setAnimation(gifDataview.animate);
      }

      // Set viewport if specified
      if (gifDataview.viewport) {
        setViewport(() => ({
          ...gifDataview.viewport,
          transitionDuration: 1000,
        }));
      }

      // Limit visible lines if specified
      if (gifDataview.visibleLines) {
        limitVisibleLines(gifDataview.visibleLines);
      }
    };

    setup();

    // Cleanup function
    return () => {
      document.querySelectorAll('.mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left')
        .forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.visibility = 'visible';
          }
        });
      setAnimation(null);
      limitVisibleLines(null);
    };
  }, []); // Empty dependency array - only run once when mounted

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        trackEvent('gif_mode_exited', { method: 'keyboard_shortcut' });
        onExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="gif-view">
      <FloatingInfoBar
        formatInfoBarText={gifDataview.formatInfoBarText}
        direction={selectedDirection}
        stationId={selectedStation}
        hour={selectedHour}
        day={selectedDay}
        selectedMonths={selectedMonths}
        animation={animation}
        visible={true}
      />
    </div>
  );
};

export default GifView; 