import { useState, useEffect, useRef } from 'react';

export const ANIMATE_BAR_CHANGE_DURATION = 500;
const LOADING_WAVE_DURATION = 3000;
const DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP = 0.02;
const MIN_PULSE_HEIGHT = 1;
const MAX_PULSE_HEIGHT = 50;
const LOADING_COLOR = [204, 204, 255];
const WAVE_FREQUENCY = 2;

export const useRidershipAnimation = (data, barScale, showPercentage, isLoading) => {
  const [lineData, setLineData] = useState({ type: 'LOADING', data: [] });
  const [animationStart, setAnimationStart] = useState(null);
  const animationFrameRef = useRef(null);
  const initialHeights = useRef({});
  const lastHeights = useRef({});

  const startAnimation = () => {
    setAnimationStart(Date.now());
  };

  const markCurrentBarHeights = (barScale, showPercentage) => {
    initialHeights.current = Object.fromEntries(data.map(d => [d.station_id, getAbsoluteHeight(d, barScale, showPercentage)]));
  };

  useEffect(() => {
    if (isLoading) {
      animateLoadingWave();
    } else if (animationStart) {
      animateToNewHeights(ANIMATE_BAR_CHANGE_DURATION);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationStart, isLoading]);

  const animateLoadingWave = () => {
    const northmostLat = Math.max(...data.map(d => d.lat));
    const southmostLat = Math.min(...data.map(d => d.lat));
    const latRange = northmostLat - southmostLat;

    const step = () => {
      const time = Date.now() % LOADING_WAVE_DURATION;
      const waveProgress = time / LOADING_WAVE_DURATION;

      const newLineData = data.map((d) => {
        const stationProgress = (northmostLat - d.lat) / latRange;
        const wrappedWaveProgress = (waveProgress + 1) % 1;
        const distanceFromWave = Math.abs(wrappedWaveProgress - stationProgress);
        const waveEffect = Math.max(0, 1 - distanceFromWave * 20);

        const height = (MIN_PULSE_HEIGHT + (MAX_PULSE_HEIGHT - MIN_PULSE_HEIGHT) * waveEffect) * 0.00005;
        lastHeights.current[d.station_id] = height;

        return {
          ...d,
          basePosition: [d.lon, d.lat],
          targetHeight: d.station_id == 600 ? 69 : height,
          color: LOADING_COLOR,
        };
      });

      setLineData({ type: 'LOADING', data: newLineData });

      if (isLoading) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const animateToNewHeights = (duration) => {
    const startTime = Date.now();

    const dataWithStationsFromPrevData = [...data]
    Object.keys(initialHeights.current).forEach((station_id) => {
        if (!data[station_id]) {
            dataWithStationsFromPrevData.push({
                ...data[station_id],
                ridership: 0,
            })
        }
    })
    const step = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const newLineData = dataWithStationsFromPrevData.map((d) => {
        // We store the normalized (true) heights, but then we divide back to the absolute height
        // since the bar scale will be applied to the absolute height before rendering.
        const targetHeightNormalized = getAbsoluteHeight(d, barScale, showPercentage);
        const startHeightNormalized = initialHeights.current[d.station_id]
          ?? lastHeights.current[d.station_id]
          ?? 0;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const currentHeight = startHeightNormalized + (targetHeightNormalized - startHeightNormalized) * easeOutCubic(progress);
          
        lastHeights.current[d.station_id] = currentHeight;
        
        return {
          ...d,
          targetHeight: currentHeight / barScale
        };
      });

      console.log('setLineData 2')
      setLineData({ type: showPercentage ? 'RIDERSHIP_PERCENTAGE' : 'RIDERSHIP', data: newLineData });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  return { lineData, startAnimation, markCurrentBarHeights };
};

const getAbsoluteHeight = (d, barScale, showPercentage) => {
  if (showPercentage) {
    return d.ridership < 1 ? 0 : d.percentage * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP * barScale;
  }
  return d.ridership < 1 ? 0 : d.ridership * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP * barScale;
};
