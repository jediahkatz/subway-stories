import { useState, useEffect, useRef } from 'react';

const ANIMATE_HOUR_CHANGE_DURATION = 500;
const LOADING_WAVE_DURATION = 3000; // Reduced from 4000 to 2000 for faster animation
const HEIGHT_COEFF = 500;
const MIN_DOT_SIZE = 100;
const MAX_DOT_SIZE = 300;
const MIN_PULSE_HEIGHT = 1;
const MAX_PULSE_HEIGHT = 50;
const LOADING_COLOR = [204, 204, 255];//[0, 100, 255]; // Blue color for loading
const WAVE_FREQUENCY = 2; // Increased frequency for smaller latitude-axis coverage

const LOADING_ROTATION_DURATION = 4000; // Time for a full rotation (in milliseconds)
const CENTER_LAT = 40.7441; // Latitude of Long Island City
const CENTER_LONG = -73.9565; // Longitude of Long Island City
const HIGHLIGHT_ANGLE = 30; // Angle (in degrees) of the radar "beam"


export const useRidershipAnimation = (filteredData, prevFilteredData, minRidershipToday, maxRidershipToday, isLoading) => {
  const [scatterPlotPoints, setScatterPlotPoints] = useState([]);
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
      animateToNewPositions(ANIMATE_HOUR_CHANGE_DURATION);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationStart, filteredData, prevFilteredData, isLoading]);

  const getColor = (value, min, max) => {
    const colorscale = [
      [210, 180, 140],
      [255, 0, 0],
    ];
    const normalizedValue = (value - min) / (max - min);
    const [r, g, b] = colorscale[0].map((c, i) => c + normalizedValue * (colorscale[1][i] - c));
    return [r, g, b];
  };

//   const animateLoadingWaveFull = () => {
//     const northmostLat = Math.max(...filteredData.map(d => d.dlat));
//     const southmostLat = Math.min(...filteredData.map(d => d.dlat));
//     const latRange = northmostLat - southmostLat;

//     const step = () => {
//       const time = Date.now() % LOADING_WAVE_DURATION;
//       const waveProgress = time / LOADING_WAVE_DURATION;

//       const scatterPoints = filteredData.flatMap((d) => {
//         const stationProgress = (northmostLat - d.dlat) / latRange;

//         // Create a more pronounced wave effect
//         const waveEffect = Math.sin(2 * Math.PI * WAVE_FREQUENCY * (stationProgress - waveProgress));
        
//         // Sharpen the wave effect
//         const sharpWaveEffect = Math.pow(Math.max(0, waveEffect), 2);

//         const height = MIN_PULSE_HEIGHT + (MAX_PULSE_HEIGHT - MIN_PULSE_HEIGHT) * sharpWaveEffect;
//         lastHeights.current[d.station_id] = height;
//         return generatePoints(d, height, LOADING_COLOR);
//       });

//       setScatterPlotPoints(scatterPoints);

//       if (isLoading) {
//         animationFrameRef.current = requestAnimationFrame(step);
//       }
//     };
//     animationFrameRef.current = requestAnimationFrame(step);
//   };
  
  const animateLoadingWave = () => {
    const northmostLat = Math.max(...filteredData.map(d => d.dlat));
    const southmostLat = Math.min(...filteredData.map(d => d.dlat));
    const latRange = northmostLat - southmostLat;

    const step = () => {
      const time = Date.now() % LOADING_WAVE_DURATION;
      const waveProgress = time / LOADING_WAVE_DURATION;

      const scatterPoints = filteredData.flatMap((d) => {
        const stationProgress = (northmostLat - d.dlat) / latRange;

        // Wrap the wave progress to create a toroidal effect
        const wrappedWaveProgress = (waveProgress + 1) % 1;

        // Calculate distance from the wave
        const distanceFromWave = Math.abs(wrappedWaveProgress - stationProgress);
        const waveEffect = Math.max(0, 1 - distanceFromWave * 20); // Adjust the '20' to change the width of the wave

        const height = MIN_PULSE_HEIGHT + (MAX_PULSE_HEIGHT - MIN_PULSE_HEIGHT) * waveEffect;
        lastHeights.current[d.station_id] = height;
        return generatePoints(d, height, LOADING_COLOR, waveEffect);
      });

      setScatterPlotPoints(scatterPoints);

      if (isLoading) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const animateLoadingRadar = () => {
    const step = () => {
      const time = Date.now() % LOADING_ROTATION_DURATION;
      const rotationAngle = (time / LOADING_ROTATION_DURATION) * 360; // 0 to 360 degrees

      const scatterPoints = filteredData.map((d) => {
        const angle = Math.atan2(d.dlat - CENTER_LAT, d.dlong - CENTER_LONG) * (180 / Math.PI);
        const normalizedAngle = (angle + 360) % 360; // Ensure angle is 0-360
        const angleDiff = (normalizedAngle - rotationAngle + 360) % 360;

        // Check if the station is within the highlight angle
        const isHighlighted = angleDiff <= HIGHLIGHT_ANGLE || angleDiff >= (360 - HIGHLIGHT_ANGLE);

        return {
          position: [d.dlong, d.dlat],
          color: isHighlighted ? LOADING_COLOR : [100, 100, 100, 100], // Green if highlighted, grey otherwise
          radius: isHighlighted ? 300 : 100, // Larger if highlighted
          ...d,
        };
      });

      setScatterPlotPoints(scatterPoints);

      if (isLoading) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const animateToNewPositions = (duration) => {
    const startTime = Date.now();

    const step = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const scatterPoints = filteredData.flatMap((d) => {
        const normalizedRidership = d.ridership / maxRidershipToday;
        const targetHeight = d.ridership < 1 ? 0 : Math.floor(normalizedRidership * HEIGHT_COEFF);
        
        let startHeight;
        if (isLoading) {
          startHeight = lastHeights.current[d.station_id] || MIN_PULSE_HEIGHT;
        } else {
          const prevData = prevFilteredData.find(pd => pd.station_id === d.station_id);
          const prevRidership = prevData ? prevData.ridership : 0;
          startHeight = prevRidership < 1 ? 0 : Math.floor(prevRidership / maxRidershipToday * HEIGHT_COEFF);
        }

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const currentHeight = Math.floor(startHeight + (targetHeight - startHeight) * easeOutCubic(progress));
        const color = getColor(d.ridership, minRidershipToday, maxRidershipToday);
        
        lastHeights.current[d.station_id] = currentHeight;
        return generatePoints(d, currentHeight, color);
      });

      setScatterPlotPoints(scatterPoints);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const generatePoints = (d, height, color, waveEffect) => {
    const points = [];
    for (let i = 0; i < height; i++) {
      // Create a gradient effect for opacity
      const opacity = (i / height) * 0.9; // Opacity increases from 0 to 0.9
      points.push({
        position: [d.dlong, d.dlat + 0.00005 * i],
        color: [...color, opacity * 255], // Apply the gradient opacity
        ...d,
      });
    }
    return points;
  };

  return { scatterPlotPoints, startAnimation };
};