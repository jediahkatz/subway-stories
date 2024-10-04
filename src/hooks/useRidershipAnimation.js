import { useState, useEffect, useRef } from 'react';

const ANIMATE_HOUR_CHANGE_DURATION = 500;
const LOADING_WAVE_DURATION = 3000;
const DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP = 0.02;
const MIN_PULSE_HEIGHT = 1;
const MAX_PULSE_HEIGHT = 50;
const LOADING_COLOR = [204, 204, 255];
const WAVE_FREQUENCY = 2;

export const useRidershipAnimation = (filteredData, prevFilteredData, isLoading) => {
  const [lineData, setLineData] = useState([]);
  const [animationStart, setAnimationStart] = useState(null);
  const animationFrameRef = useRef(null);
  const lastHeights = useRef({});

  const startAnimation = () => {
    setAnimationStart(Date.now());
  };

  useEffect(() => {
    if (isLoading) {
      animateLoadingWave();
    } else if (animationStart) {
      animateToNewHeights(ANIMATE_HOUR_CHANGE_DURATION);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationStart, filteredData, prevFilteredData, isLoading]);

  const animateLoadingWave = () => {
    const northmostLat = Math.max(...filteredData.map(d => d.lat));
    const southmostLat = Math.min(...filteredData.map(d => d.lat));
    const latRange = northmostLat - southmostLat;

    const step = () => {
      const time = Date.now() % LOADING_WAVE_DURATION;
      const waveProgress = time / LOADING_WAVE_DURATION;

      const newLineData = filteredData.map((d) => {
        const stationProgress = (northmostLat - d.lat) / latRange;
        const wrappedWaveProgress = (waveProgress + 1) % 1;
        const distanceFromWave = Math.abs(wrappedWaveProgress - stationProgress);
        const waveEffect = Math.max(0, 1 - distanceFromWave * 20);

        const height = MIN_PULSE_HEIGHT + (MAX_PULSE_HEIGHT - MIN_PULSE_HEIGHT) * waveEffect;
        lastHeights.current[d.station_id] = height;

        return {
          ...d,
          basePosition: [d.lon, d.lat],
          targetHeight: height * 0.00005,
          color: LOADING_COLOR,
        };
      });

      setLineData(newLineData);

      if (isLoading) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const animateToNewHeights = (duration) => {
    const startTime = Date.now();

    const step = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const newLineData = filteredData.map((d) => {
        const targetHeight = d.ridership < 1 ? 0 : d.ridership * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP;
        
        let startHeight;
        if (isLoading) {
          startHeight = lastHeights.current[d.station_id] || 0;
        } else {
          const prevData = prevFilteredData.find(pd => pd.station_id === d.station_id);
          const prevRidership = prevData ? prevData.ridership : 0;
          startHeight = prevRidership < 1 ? 0 : prevRidership * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP;
        }

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const currentHeight = startHeight + (targetHeight - startHeight) * easeOutCubic(progress);
        
        lastHeights.current[d.station_id] = currentHeight;
        
        return {
          ...d,
          targetHeight: currentHeight
        };
      });

      setLineData(newLineData);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  return { lineData, startAnimation };
};