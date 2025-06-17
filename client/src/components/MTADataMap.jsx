// src/components/MTADataMap.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ColumnLayer, DeckGL, ScatterplotLayer } from 'deck.gl';
import ReactMapGL from 'react-map-gl';
import { stationIdToStation, stations } from '../lib/stations';
import { RidershipTooltip, Tooltip } from './Tooltip';
import DataControls from './DataControls';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MTADataMap.css';
import { useDotPulseAnimation } from '../hooks/useDotAnimation';
import subwayRoutes from '../data/nyc-subway-routes.js';
import subwayLayerStyles from '../data/subway-layer-styles.js';
import MapBarLayer, { BAR_RADIUS, useUpVector } from './MapBarLayer';
import { saveStateToSessionStorage, loadStateFromSessionStorage } from '../lib/sessionManager.js';
import ViewTabs from './ViewTabs';
import StoriesView, { ALL_MONTHS } from './StoriesView';
import { FlyToInterpolator } from 'deck.gl';
import { useFetchData } from '../hooks/useFetchData';
import { useBarsAnimation } from '../hooks/useBarsAnimation';
import { getAbsoluteHeight } from '../lib/bar-heights';
import { usePrevious } from '../hooks/usePrevious';
import { ALL_STATIONS_ID } from '../lib/all-stations';
import { getColorIntervals, colorScale } from './ColorLegend.jsx';
import ColorLegend from './ColorLegend';
import { splitNameAndLines } from './SubwayLineSymbol.jsx';
import { trackEvent } from '../lib/analytics.js';
import GifView from './GifView';
import { useAnimationManager } from '../hooks/useAnimationManager';
import { getEnvVar, isDev } from '../lib/env.js';

const NYC_BOUNDS = {
  minLng: -74.2591,  // Southwest longitude
  minLat: 40.4774,   // Southwest latitude
  maxLng: -73.7004,  // Northeast longitude
  maxLat: 40.9176,   // Northeast latitude
  minZoom: 10,
};

export const MAIN_STATION_COLOR_ARRIVING = [107, 159, 255];//[65, 146, 246]; //[50, 115, 246];
export const MAIN_STATION_COLOR_DEPARTING = [107, 220, 159];
const LOADING_COLOR = [204, 204, 255];

const PERCENTAGE_BAR_SCALE = 1 / 25;

// Keep in sync with StoriesView.css
export const MOBILE_BREAKPOINT_WIDTH = 800;

function constrainViewState({viewState}) {
  const {longitude, latitude, zoom, pitch, bearing} = viewState;

  // Constrain longitude and latitude to NYC bounds
  const constrainedLongitude = Math.max(Math.min(longitude, NYC_BOUNDS.maxLng), NYC_BOUNDS.minLng);
  const constrainedLatitude = Math.max(Math.min(latitude, NYC_BOUNDS.maxLat), NYC_BOUNDS.minLat);
  const constrainedZoom = Math.max(NYC_BOUNDS.minZoom, zoom);
  const constrainedPitch = pitch < 0.1 ? 0 : Math.max(0, Math.min(pitch, 60));  // Limit pitch to 0-60 degrees
  const constrainedBearing = bearing % 360;  // Keep bearing within 0-360 degrees

  return {
    ...viewState,
    longitude: constrainedLongitude,
    latitude: constrainedLatitude,
    zoom: constrainedZoom,
    bearing: constrainedBearing,
    pitch: constrainedPitch
  };
}

const MTADataMap = ({ mapboxToken }) => {
  const [initialViewport, setInitialViewport] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.viewport || {
      latitude: stationIdToStation['611'].lat,
      longitude: stationIdToStation['611'].lon,
      zoom: 11.37,
      bearing: 0,
      pitch: 0,
      width: '100vw',
      height: '100vh',
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator(),
    };
  });

  const isMobileSize = window.innerWidth <= MOBILE_BREAKPOINT_WIDTH;

  const data = useRef([]);
  const filteredData = useRef(stations.map(s => ({
    station_id: s.complex_id,
    lon: s.lon,
    lat: s.lat,
    ridership: 0,
    percentage: 0,
  })));

  const [hoverInfo, setHoverInfo] = useState(null);
  const [infoTooltipInfo, setInfoTooltipInfo] = useState(null);
  const [selectedHour, setSelectedHour] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedHour || 8;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedDay || 'Wednesday';
  });
  const [selectedStation, setSelectedStation] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedStation || '611';
  });
  const [selectedDirection, setSelectedDirection] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedDirection || 'comingFrom';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBarScale, setSelectedBarScale] = useState(null); // number | null (default)
  const [selectedMonths, setSelectedMonths] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedMonths || ALL_MONTHS;
  });
  const [showPercentage, setShowPercentage] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.showPercentage || false;
  });

  const [activeView, setActiveView] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.activeView || 'stories'
  });

  // Track Alt key for zooming in story view
  const [altKeyDown, setAltKeyDown] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') {
        setAltKeyDown(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Alt') {
        setAltKeyDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeView]);

  // I know, this is a hack and doesn't really make sense. But it somehow fixes the issue where there's a stale
  // state value that's not updated in the handleDataSettingsChange function.
  const dataStateRef = useRef({
    selectedHour,
    selectedDay,
    selectedStation,
    selectedDirection,
    selectedMonths,
    showPercentage,
    selectedBarScale,
  });

  const mapRef = useRef(null);
  const deckglRef = useRef(null);

  const setViewport = useCallback((prevViewportUpdateFunction) => {
    setInitialViewport(prevInitialViewport => {
      const prevViewport = deckglRef.current?.deck.viewState 
        ? { ...deckglRef.current.deck.viewState, ...deckglRef.current.deck.viewState['default-view'] }
        : prevInitialViewport;
      const newViewport = prevViewportUpdateFunction({
        latitude: prevViewport.latitude,
        longitude: prevViewport.longitude,
        zoom: prevViewport.zoom,
        bearing: prevViewport.bearing,
        pitch: prevViewport.pitch,
      });
      if (deckglRef.current?.deck.viewState) {
        deckglRef.current.deck.viewState = newViewport
      }
      return newViewport;
    });
  }, []);

  const barScaleLocked = useRef(selectedBarScale !== null);
  const initialBarScale = useRef(getInitialBarScale(data.current, selectedStation));
  const barScale = useRef(
    barScaleLocked ? selectedBarScale :
    showPercentage ? PERCENTAGE_BAR_SCALE : 
                     initialBarScale.current
  );

  const { barData, startAnimation: startBarAnimation, cancelAnimation: cancelBarAnimation } = useBarsAnimation();
  // This may be bad, if it turns out to be a problem we can recompute it in handleDataSettingsChange
  const previousBarHeights = usePrevious(barData.heights) || Object.fromEntries(stations.map(s => [s.complex_id, { currentHeight: 0 }]));

  const { fetchData } = useFetchData();

  // Add new state for story position
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const [showAboutView, setShowAboutView] = useState(false);

  const toggleAboutView = useCallback(() => {
    setShowAboutView(prev => {
      const isOpening = !prev;
      if (isOpening) {
        trackEvent('about_view_clicked');
      }
      return !prev;
    });
  }, []);

  const handleDataSettingsChange = React.useCallback(async ({ 
    newSelectedDay, 
    newSelectedStation, 
    newSelectedDirection, 
    newSelectedMonths, 
    newSelectedHour, 
    newShowPercentage,
    newSelectedBarScale,
    initialFetch = false,
    animationType = 'cubic',
  }) => {
    const { selectedDay, selectedStation, selectedDirection, selectedMonths, selectedHour, showPercentage, selectedBarScale } = dataStateRef.current;

    const dayChanged = newSelectedDay !== undefined && newSelectedDay !== selectedDay;
    const stationChanged = newSelectedStation !== undefined && newSelectedStation !== selectedStation;
    const directionChanged = newSelectedDirection !== undefined && newSelectedDirection !== selectedDirection;
    const monthsChanged = newSelectedMonths !== undefined && newSelectedMonths !== selectedMonths;
    const hourChanged = newSelectedHour !== undefined && newSelectedHour !== selectedHour;
    const showPercentageChanged = newShowPercentage !== undefined && newShowPercentage !== showPercentage;
    const selectedBarScaleChanged = newSelectedBarScale !== undefined && newSelectedBarScale !== selectedBarScale;

    newSelectedDay = dayChanged ? newSelectedDay : selectedDay;
    newSelectedStation = stationChanged ? newSelectedStation : selectedStation;
    newSelectedDirection = directionChanged ? newSelectedDirection : selectedDirection;
    newSelectedMonths = monthsChanged ? newSelectedMonths : selectedMonths;
    newSelectedHour = hourChanged ? newSelectedHour : selectedHour;
    newShowPercentage = showPercentageChanged ? newShowPercentage : showPercentage;
    newSelectedBarScale = selectedBarScaleChanged ? newSelectedBarScale : selectedBarScale;

    barScaleLocked.current = newSelectedBarScale !== null;

    const shouldFetchData = dayChanged ||
                             stationChanged ||
                             directionChanged ||
                             monthsChanged ||
                             showPercentageChanged ||
                             initialFetch;

    const shouldAnimateBarChange = shouldFetchData || hourChanged;
    const shouldCompletePulseAnimationOnce = (stationChanged || directionChanged || initialFetch) && newSelectedStation !== ALL_STATIONS_ID;

    if (dayChanged) { setSelectedDay(newSelectedDay); dataStateRef.current.selectedDay = newSelectedDay; }
    if (stationChanged) { setSelectedStation(newSelectedStation); dataStateRef.current.selectedStation = newSelectedStation; }
    if (directionChanged) { setSelectedDirection(newSelectedDirection); dataStateRef.current.selectedDirection = newSelectedDirection; }
    if (monthsChanged) { setSelectedMonths(newSelectedMonths); dataStateRef.current.selectedMonths = newSelectedMonths; }
    if (hourChanged) { setSelectedHour(newSelectedHour); dataStateRef.current.selectedHour = newSelectedHour; }
    if (showPercentageChanged) { setShowPercentage(newShowPercentage); dataStateRef.current.showPercentage = newShowPercentage; }
    if (selectedBarScaleChanged) { setSelectedBarScale(newSelectedBarScale); dataStateRef.current.selectedBarScale = newSelectedBarScale; }
    
    if (shouldFetchData) {
      console.log('fetching data')
      setIsLoading(true);
      let animationCompletedOncePromise;
      let loadingAnimationStarted = false;
      let abortedDueToAnotherLoad = false;

      // This is kind of shitty GPT code, but it makes sure that unless shouldCompletePulseAnimationOnce is true,
      // we wait 50ms for the data to load before starting the pulse animation (in case it's cached)
      const startLoadingAnimation = () => {
        if (newSelectedStation === ALL_STATIONS_ID) {
          animationCompletedOncePromise = startBarAnimation({
            type: 'WAVE_VERTICAL_DOWN',
            animationType,
            stationLocations: Object.fromEntries(stations.map(d => [d.complex_id, [d.lon, d.lat]]))
          });
        } else {
          animationCompletedOncePromise = startBarAnimation({
            type: newSelectedDirection === 'comingFrom' ? 'WAVE_RADIAL_IN' : 'WAVE_RADIAL_OUT',
            animationType,
            centerLocation: [stationIdToStation[newSelectedStation].lon, stationIdToStation[newSelectedStation].lat],
            otherStationLocations: Object.fromEntries(stations.map(d => [d.complex_id, [d.lon, d.lat]]))
          });
        }
        loadingAnimationStarted = true;
      }

      if (shouldCompletePulseAnimationOnce) {
        startLoadingAnimation();
      }

      const animationTimeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          if (!loadingAnimationStarted) {
            startLoadingAnimation();
          }
          resolve();
        }, 150);
      });

      try {
        const fetchDataPromise = fetchData({
          selectedDay: newSelectedDay,
          selectedStation: newSelectedStation,
          selectedDirection: newSelectedDirection,
          selectedMonths: newSelectedMonths,
          showPercentage: newShowPercentage
        });

        const [{ processedData, stationIdToTotalRidership: stationIdToTotalRidershipByHour }] = 
          await Promise.all([fetchDataPromise, animationTimeoutPromise]);

        const sortedData = processedData.sort((a, b) => {
          return b.lat - a.lat;
        });

        initialBarScale.current = getInitialBarScale(sortedData, newSelectedStation);
        barScale.current = barScaleLocked.current ? newSelectedBarScale :
                               newShowPercentage  ? PERCENTAGE_BAR_SCALE : 
                                                    initialBarScale.current;

        data.current = sortedData;
        if (newShowPercentage && stationIdToTotalRidershipByHour) {
          data.current = data.current.map(d => {
            const totalRidershipByHour = stationIdToTotalRidershipByHour[d.station_id];
            const totalRidership = totalRidershipByHour ? totalRidershipByHour[d.hour] ?? 0 : 0;
            return {
              ...d,
              percentage: totalRidership > 0 ? 100 * d.ridership / totalRidership : 0,
            }
          })
        }
        filteredData.current = data.current.filter(d => d.hour === newSelectedHour);

        if (shouldCompletePulseAnimationOnce) {
          await animationCompletedOncePromise;
        }

        setIsLoading(false);

      } catch (error) {
        if (error.name === 'AbortError') {
          abortedDueToAnotherLoad = true;
        } else {
          console.error('Failed to load data:', error);
        }
      } finally {
        if (!abortedDueToAnotherLoad) {
          setIsLoading(false);
        }
      }

    } else if (selectedBarScaleChanged) {
      barScale.current = barScaleLocked.current ? newSelectedBarScale :
                             newShowPercentage  ? PERCENTAGE_BAR_SCALE : 
                                                  initialBarScale.current;

    } else if (hourChanged) {
      filteredData.current = data.current.filter(d => d.hour === newSelectedHour);
    }

    const newTargetBarHeights = Object.fromEntries(filteredData.current.map(d => [d.station_id, getAbsoluteHeight(d, barScale.current, newShowPercentage)]));

    if (shouldAnimateBarChange) {
      startBarAnimation({
        type: 'ANIMATE_BAR_CHANGE',
        // initialBarHeights: Object.fromEntries(stations.map(s => [s.complex_id, previousBarHeights[s.complex_id].currentHeight])),
        newBarHeights: newTargetBarHeights,
      });
    } else if (selectedBarScaleChanged) {
      startBarAnimation({
        type: 'NO_ANIMATE_BAR_CHANGE',
        newBarHeights: newTargetBarHeights,
      });
    }

  }, [
    selectedDay, 
    selectedStation, 
    selectedDirection, 
    selectedMonths, 
    selectedHour, 
    showPercentage, 
    selectedBarScale, 
    previousBarHeights, 
  ])

  useEffect(() => {
    // Initial load
    handleDataSettingsChange({
      newSelectedDay: selectedDay,
      newSelectedStation: selectedStation,
      newSelectedDirection: selectedDirection,
      newSelectedMonths: selectedMonths,
      newSelectedHour: selectedHour,
      newShowPercentage: showPercentage,
      initialFetch: true,
    })
  }, [])

  const handleSetSelectedHour = React.useCallback((hour) => {
    handleDataSettingsChange({ newSelectedHour: hour });
  }, [handleDataSettingsChange]);

  const handleSetSelectedDay = React.useCallback((day) => {
    handleDataSettingsChange({ newSelectedDay: day });
  }, [handleDataSettingsChange]);

  const handleSetSelectedStation = React.useCallback((station) => {
    handleDataSettingsChange({ newSelectedStation: station });
  }, [handleDataSettingsChange]);

  const handleSetSelectedDirection = React.useCallback((direction) => {
    handleDataSettingsChange({ newSelectedDirection: direction });
  }, [handleDataSettingsChange]);

  const handleSetSelectedMonths = React.useCallback((months) => {
    handleDataSettingsChange({ newSelectedMonths: months });
  }, [handleDataSettingsChange]);

  const handleSetShowPercentage = React.useCallback((shouldShowPercentage) => {
    handleDataSettingsChange({ newShowPercentage: shouldShowPercentage });
  }, [handleDataSettingsChange]);

  const handleSetSelectedBarScale = React.useCallback((scale) => {
    handleDataSettingsChange({ newSelectedBarScale: scale });
  }, [handleDataSettingsChange]);

  const getColorRelative = (value, max) => {
    const colorscale = [
      [210, 180, 140],
      [255, 0, 0],
    ];
    const normalizedValue = value / max;
    const [r, g, b] = colorscale[0].map((c, i) => c + normalizedValue * (colorscale[1][i] - c));
    return [r, g, b];
  };

  const getColorAbsolute = (value) => {
    const colorIntervals = getColorIntervals(selectedStation === ALL_STATIONS_ID)
    // Find the interval that contains our value
    let intervalIndex = colorIntervals.findIndex(interval => value < interval);
    if (intervalIndex === -1) return colorScale[colorIntervals.length - 1]; // For values above the highest interval
    if (intervalIndex === 0) return colorScale[0]; // For values below the lowest interval

    // Get the two colors to interpolate between
    const color1 = colorScale[intervalIndex - 1];
    const color2 = colorScale[intervalIndex];

    // Get the interval bounds
    const lowerBound = colorIntervals[intervalIndex - 1] || 0;
    const upperBound = colorIntervals[intervalIndex];

    // Calculate how far between the bounds our value is (0 to 1)
    const t = (value - lowerBound) / (upperBound - lowerBound);

    // Linearly interpolate between the colors
    return color1.map((c, i) => Math.round(c + (color2[i] - c) * t));
  };

  const convertToGrayscale = (rgba) => {
    const [r, g, b, a] = rgba;
    const grayscale = r * 0.299 + g * 0.587 + b * 0.114;
    return [grayscale, grayscale, grayscale, a];
  };

  const [visibleLines, setVisibleLines] = useState(null);
  const limitVisibleLines = useCallback((visibleLines) => {
    if (!visibleLines) {
      setVisibleLines(null);
    } else {
      setVisibleLines(new Set(visibleLines));
    }

    const map = mapRef.current
    subwayLayerStyles.forEach((style) => {
      const layerId = `subway-line-${style.id}`;

      if (!visibleLines) {
        map?.setFilter(layerId, style.filter)
      } else {
        map?.setFilter(layerId, [
          'all',
          [...style.filter],
          ['any',
            ...visibleLines.map(line => ['in', line, ['get', 'symbols']]),
          ]
        ]);
      }
    });
  }, [])

  const filteredDataWithStationsAnimatingToZero = useMemo(() => {
    const stationIds = new Set(filteredData.current.map(d => Number(d.station_id)));
    const missingStations = stations.filter(s => !stationIds.has(Number(s.complex_id)));
    return [
      ...filteredData.current,
      ...missingStations.map(s => ({
        station_id: s.complex_id,
        ridership: 0,
        percentage: 0,
        lat: s.lat,
        lon: s.lon,
      }))
    ];
  }, [filteredData.current]);

  const getMapBarColor = useCallback(d => {
    if (barData.type === 'LOADING') {
      return LOADING_COLOR;
    }

    const color = [...getColorAbsolute(d.ridership), 255];

    const name = getStationName(d.station_id);
    const { lines } = splitNameAndLines(name);
    const isOnVisibleLine = !visibleLines || visibleLines.intersection(new Set(lines)).size > 0;

    if (!isOnVisibleLine) {
      return convertToGrayscale(color);
    }

    const isHighlighted = hoverInfo?.stationId == d.station_id
    if (isHighlighted) {
      const highlightedColor = color.map((c, i) => 
        // Don't modify alpha channel (index 3)
        i === 3 ? c : Math.min(255, Math.round(c * 1.5))
      )
      return highlightedColor
    }
    
    return color;
  }, [barData, hoverInfo])

  const viewport = deckglRef.current?.deck.viewState 
    ? { ...deckglRef.current.deck.viewState, ...deckglRef.current.deck.viewState['default-view'] }
    : initialViewport;

  const upVector = useUpVector(mapRef.current, viewport)

  const mapBarLayer2d = new MapBarLayer({
    id: 'ridership-composite-layer',
    data: filteredDataWithStationsAnimatingToZero,
    pickable: true,
    getBasePosition: d => [d.lon, d.lat],
    getHeight: d => barData.heights[d.station_id]?.currentHeight ?? 0,
    getWidth: _d => BAR_RADIUS,
    getColor: getMapBarColor,
    upVector,
    onHover: (info) => {
      if (!info.object) {
        setHoverInfo(null);
        return
      }

      const stationName = getStationName(info.object.station_id);
      const { lines } = splitNameAndLines(stationName);
      const isOnVisibleLine = !visibleLines || visibleLines.intersection(new Set(lines)).size > 0;
      if (isOnVisibleLine) {
        setHoverInfo({
          x: info.x,
          y: info.y,
          stationName,
          stationId: info.object.station_id,
          ridership: info.object.ridership,
          percentage: info.object.percentage,
          percentageLabel: selectedDirection === 'goingTo' ? '% of arrivals here' : '% of departures here',
          showPercentage,
          positionedLoosely: true,
        });
      } else {
        setHoverInfo(null);
      }
    },
    highlightColor: d => {
      const originalColor = getMapBarColor(d)
      const highlightedColor = originalColor.map((c, i) => 
        // Don't modify alpha channel (index 3)
        i === 3 ? c : Math.min(255, Math.round(c * 1.5))
      )
      return highlightedColor
    },
    updateTriggers: {
      data: [filteredDataWithStationsAnimatingToZero],
      getColor: [filteredDataWithStationsAnimatingToZero, getMapBarColor],
      getHeight: [barScale, filteredDataWithStationsAnimatingToZero, barData],
      bearing: [viewport.bearing],
    }
  });

  const mapBarLayer3d = new ColumnLayer({
    id: 'ridership-column-layer',
    data: filteredDataWithStationsAnimatingToZero.filter(d => barData.heights[d.station_id]?.currentHeight ?? 0 > 0),
    pickable: true,
    extruded: true,
    getPosition: d => [d.lon, d.lat],
    getElevation: d => barData.heights[d.station_id]?.currentHeight ?? 0,
    getFillColor: getMapBarColor,
    getLineColor: [0, 0, 0],
    getLineWidthMinPixels: 1,
    radius: BAR_RADIUS,
    flatShading: true,
    material: {
      ambient: 1,
      diffuse: 0,
      shininess: 0,
      specularColor: [0, 0, 0]
    },
    elevationScale: 100000,
    onHover: (info) => {
      if (!info.object) {
        setHoverInfo(null);
        return
      }

      const stationName = getStationName(info.object.station_id);
      const { lines } = splitNameAndLines(stationName);
      const isOnVisibleLine = !visibleLines || visibleLines.intersection(new Set(lines)).size > 0;
      if (isOnVisibleLine) {
        setHoverInfo({
          x: info.x,
          y: info.y,
          stationName,
          stationId: info.object.station_id,
          ridership: info.object.ridership,
          percentage: info.object.percentage,
          percentageLabel: selectedDirection === 'goingTo' ? '% of arrivals here' : '% of departures here',
          showPercentage,
        });
      } else {
        setHoverInfo(null);
      }
    },
    updateTriggers: {
      data: [filteredDataWithStationsAnimatingToZero],
      getColor: [filteredDataWithStationsAnimatingToZero, barData, visibleLines],
      getElevation: [barScale, filteredDataWithStationsAnimatingToZero, barData],
    }
  })


  const viewportIs3d = viewport.pitch > 0;
  const mapBarLayer = viewportIs3d ? mapBarLayer3d : mapBarLayer2d;

  const mainStationIndicatorLayers = useMainStationIndicatorLayers(selectedStation, selectedDirection, filteredData, viewport, setHoverInfo);

  // replace this useEffect with a function that gets called imperatively when the data settings change
  useEffect(() => {
    const stateToSave = {
      viewport,
      selectedHour,
      selectedDay,
      selectedStation,
      selectedDirection,
      selectedMonths,
      showPercentage,
      activeView
    };
    saveStateToSessionStorage(stateToSave);
  }, [viewport, selectedHour, selectedDay, selectedStation, selectedDirection, selectedMonths, showPercentage, activeView]);
  
  const drawSubwayLines = useCallback((map) => {
    map.addSource('nyc-subway-routes', {
      type: 'geojson',
      data: subwayRoutes,
    });

    subwayLayerStyles.forEach((style) => {
      const layerId = `subway-line-${style.id}`;

      const newStyle = {
        ...style,
        id: layerId,
      };

      map.addLayer(newStyle);
    });
  }, []);

  const setHoveredStation = useCallback((stationId) => {
    if (stationId === null) {
      setHoverInfo(null);
      return;
    }
    const stationName = getStationName(stationId)

    const map = mapRef.current
    const station = stationIdToStation[stationId]
    const positionOnMap = [station.lon, station.lat]
    const positionOnScreen = map.project(positionOnMap)

    if (stationId == selectedStation) {
      const totalRidership = filteredData.current.reduce((acc, d) => acc + d.ridership, 0);
      setHoverInfo({
        x: positionOnScreen.x,
        y: positionOnScreen.y,
        stationName,
        stationId: selectedStation,
        ridership: totalRidership,
        ridershipLabel: selectedDirection === 'goingTo' ? 'Total departures' : 'Total arrivals',
        showPercentage: false,
        positionedLoosely: true,
      });
    } else {
      const data = filteredData.current.find(d => d.station_id == stationId)
      if (!data) {
        return
      }
      const ridership = data.ridership
      const height = getAbsoluteHeight(data, barScale.current, showPercentage)
      // todo: 3d
      const heightInPx = positionOnScreen.y - map.project([station.lon, station.lat + height]).y
      setHoverInfo({
        x: positionOnScreen.x,
        y: positionOnScreen.y - (heightInPx / 2),
        stationName,
        stationId: stationId,
        ridership,
        ridershipLabel: 'Ridership',
        showPercentage: false,
        positionedLoosely: false,
      });
    }
  }, [setHoverInfo, selectedDirection, selectedStation, filteredData, showPercentage])

  const refreshHoverInfo = useCallback((mouseX, mouseY) => {
    if (!deckglRef.current) {
      setHoverInfo(null);
      return
    }
    const hoveredLayer = deckglRef.current.pickObject({ x: mouseX, y: mouseY, radius: 8 })
    if (!hoveredLayer) {
      setHoverInfo(null);
      return
    }

    const stationName = getStationName(hoveredLayer.object.station_id);
    const { lines } = splitNameAndLines(stationName);
    const isOnVisibleLine = !visibleLines || visibleLines.intersection(new Set(lines)).size > 0;
    if (!isOnVisibleLine) {
      setHoverInfo(null);
      return
    }

    let totalRidership;
    if (hoveredLayer.object.station_id === selectedStation) {
      totalRidership = filteredData.current.reduce((acc, d) => acc + d.ridership, 0);
    } else {
      const data = filteredData.current.find(d => d.station_id === hoveredLayer.object.station_id)
      if (!data) {
        setHoverInfo(null);
        return
      }
      totalRidership = data.ridership
    }
    setHoverInfo({
      x: mouseX,
      y: mouseY,
      stationName,
      stationId: hoveredLayer.object.station_id,
      ridership: totalRidership,
      ridershipLabel: selectedDirection === 'goingTo' ? 'Total departures' : 'Total arrivals',
      showPercentage: false,
      positionedLoosely: true,
    });
    
  }, [setHoverInfo, filteredData, selectedStation, selectedDirection, visibleLines])

  const canScrollZoom = activeView !== 'stories' || altKeyDown;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Cmd+G (Mac) or Ctrl+G (Windows)
      if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
        event.preventDefault();
        if (activeView !== 'gif') {
          trackEvent('gif_mode_entered', { method: 'keyboard_shortcut' });
          setActiveView('gif');
        }
      }
    };

    // Gif mode is an internal-only feature
    if (isDev) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeView]);

  const { animation, setAnimation } = useAnimationManager({
    onAnimationTick: React.useCallback(async ({ newDataSettings, mousePosition }) => {
      await handleDataSettingsChange(newDataSettings);
      refreshHoverInfo(mousePosition.x, mousePosition.y);
      // handleDataSettingsChange is a mess so let's not put it into the deps array
    }, [refreshHoverInfo])
  });

  return (
    <div className="map-container">
      {!isMobileSize && activeView !== 'gif' && (
        <ViewTabs 
          activeView={activeView} 
          setActiveView={setActiveView} 
          limitVisibleLines={limitVisibleLines} 
          setSelectedBarScale={handleSetSelectedBarScale} 
        />
      )}
      <DeckGL
        ref={deckglRef}
        initialViewState={initialViewport}
        controller={{ scrollZoom: canScrollZoom }}
        layers={[...mainStationIndicatorLayers, mapBarLayer]}
        pickingRadius={8}
        getCursor={({ isDragging, isHovering }) => {
          if (activeView === 'stories' && canScrollZoom) return 'ns-resize'
          if (isDragging) return 'move'
          if (isHovering) return 'pointer'
          return 'default'
        }}
        onViewStateChange={({viewState}) => {
          const constrained = constrainViewState({viewState})
          saveStateToSessionStorage({ ...loadStateFromSessionStorage(), viewport: constrained });
          return constrained;
        }}
      >
        <ReactMapGL
          {...viewport}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onLoad={(e) => {
            const map = e.target;
            mapRef.current = map;
            drawSubwayLines(map);

            // Turn off/reduce some distracting labels
            map.setLayoutProperty('road-label-simple', 'visibility', 'none');
            map.setLayoutProperty('poi-label', 'visibility', 'none');
            map.setLayoutProperty('settlement-major-label', 'visibility', 'none');
            map.setLayoutProperty('settlement-minor-label', 'visibility', 'none');

            map.setPaintProperty('airport-label', 'text-color', 'hsl(0, 0%, 54%)');
          }}
        />
      </DeckGL>
      {activeView === 'visualization' && (
        <DataControls
          selectedHour={selectedHour}
          setSelectedHour={handleSetSelectedHour}
          selectedDay={selectedDay}
          setSelectedDay={handleSetSelectedDay}
          selectedStation={selectedStation}
          setSelectedStation={handleSetSelectedStation}
          selectedDirection={selectedDirection}
          setSelectedDirection={handleSetSelectedDirection}
          barScaleLocked={barScaleLocked.current}
          barScale={barScale.current}
          setSelectedBarScale={handleSetSelectedBarScale}
          initialBarScale={initialBarScale.current}
          selectedMonths={selectedMonths}
          setSelectedMonths={handleSetSelectedMonths}
          showPercentage={showPercentage}
          setShowPercentage={handleSetShowPercentage}
          setInfoTooltipInfo={setInfoTooltipInfo}
        />
      )}
      {activeView === 'stories' && (
        <StoriesView 
          setViewport={setViewport}
          handleDataSettingsChange={handleDataSettingsChange}
          limitVisibleLines={limitVisibleLines}
          currentStoryIndex={currentStoryIndex}
          currentPartIndex={currentPartIndex}
          selectedDirection={selectedDirection}
          selectedStation={selectedStation}
          selectedHour={selectedHour}
          selectedDay={selectedDay}
          selectedMonths={selectedMonths}
          showAboutView={showAboutView}
          setCurrentStoryIndex={setCurrentStoryIndex}
          setCurrentPartIndex={setCurrentPartIndex}
          setHoveredStation={setHoveredStation}
          refreshHoverInfo={refreshHoverInfo}
          mapRef={mapRef}
          animation={animation}
          setAnimation={setAnimation}
        />
      )}
      {hoverInfo && !isLoading && (
        <RidershipTooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          stationName={hoverInfo.stationName}
          ridership={hoverInfo.ridership}
          percentage={hoverInfo.showPercentage ? hoverInfo.percentage : null}
          ridershipLabel={hoverInfo.ridershipLabel}
          percentageLabel={hoverInfo.percentageLabel}
          positionedLoosely={hoverInfo.positionedLoosely}
        />
      )}
      {infoTooltipInfo && (
        <Tooltip x={infoTooltipInfo.x} y={infoTooltipInfo.y} positionedLoosely={true} tooltipHeight={177} beakPosition={'bottom'}>
          <div className='info-tooltip-content'>
            <p>Adjust the height of the ridership bars.</p>
            <p><strong>Auto mode:</strong> Automatically adjust the scale based on today's maximum ridership.</p>
            <p><strong>Locked mode:</strong> Manually set the scale, keeping it consistent across different views.</p>
          </div>
        </Tooltip>
      )}
      {!isMobileSize && activeView !== 'gif' && (
        <View3DToggle is3D={viewportIs3d} setViewport={setViewport} />
      )}
      <ColorLegend 
        allStationsView={selectedStation === ALL_STATIONS_ID} 
        style={{ top: activeView === 'gif' ? 10 : undefined }}
      />
      {activeView !== 'gif' && (
        <div className="info-icon-container">
          <button className="info-button" onClick={toggleAboutView}>
            <span className="info-icon map-info-icon" />
          </button>
        </div>
      )}

      {activeView === 'gif' && (
        <GifView
          handleDataSettingsChange={handleDataSettingsChange}
          setViewport={setViewport}
          limitVisibleLines={limitVisibleLines}
          selectedDirection={selectedDirection}
          selectedStation={selectedStation}
          selectedHour={selectedHour}
          selectedDay={selectedDay}
          selectedMonths={selectedMonths}
          animation={animation}
          setAnimation={setAnimation}
          onExit={() => setActiveView('visualization')}
        />
      )}

      {showAboutView && (
        <div className="about-view">
          <div className="about-content">
            <h1>Subway Stories</h1>
            <p>
              Subway Stories is an interactive data visualization that explores NYC subway ridership patterns 
              through engaging narratives and real-time data. Created for the MTA Open Data Challenge 2024, 
              this project transforms raw transit data into compelling stories about how New Yorkers move 
              through their city.
            </p>
            <p>
              Discover the hidden patterns in subway usage - from rush hour flows to weekend adventures, 
              from seasonal changes to the unique character of each station. Each story reveals a different 
              facet of the vibrant, ever-moving tapestry that is New York City's subway system.
            </p>

            <div className="faq">
              <h4>Frequently Asked Questions</h4>
              
              <h5>What data does this visualization use?</h5>
              <p>
                The visualization uses MTA turnstile data and GTFS feeds to show real ridership patterns 
                across the NYC subway system. The data is processed to show arrivals and departures at 
                each station by hour, day, and month.
              </p>

              <h5>How do I interact with the visualization?</h5>
              <p>
                Use the control panel on the left to select different stations, times, and viewing options. 
                In Stories mode, scroll through the narrative to explore different aspects of subway ridership. 
                In Visualization mode, customize the data view with various filters and display options.
              </p>

              <h5>What do the height and colors of the bars represent?</h5>
              <p>
                Bar heights represent ridership volume - taller bars indicate more passengers. Colors represent 
                ridership intensity on a scale from low (brown) to high (red). You can toggle between absolute 
                numbers and percentages, and adjust the scale manually or use auto-scaling.
              </p>

              <h5>Can I switch between 2D and 3D views?</h5>
              <p>
                Yes! Use the 3D toggle button in the bottom left to switch perspectives. The 3D view provides 
                a different spatial understanding of the data, while 2D mode offers clearer readability.
              </p>
            </div>

            <div className="credits">
              <h4>Credits</h4>
              <p>Created for the MTA Open Data Challenge 2024</p>
              <p>Data source: Metropolitan Transportation Authority (MTA)</p>
              <p>Visualization: Built with React, Deck.GL, and Mapbox</p>
              <p>Design: Interactive storytelling meets transit data</p>
            </div>
          </div>
          <button className="close-about-view" onClick={toggleAboutView}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

const useMainStationIndicatorLayers = (selectedStation, selectedDirection, filteredData, viewport, setHoverInfo) => {
  const pulseCircles = useDotPulseAnimation(selectedDirection);

  if (selectedStation === ALL_STATIONS_ID) {
    return []
  }

  const selectedStationData = {
    station_id: selectedStation,
    position: [Number(stationIdToStation[selectedStation].lon), Number(stationIdToStation[selectedStation].lat)]
  }
  const pulseData = pulseCircles.map(pulseCircle => ({ ...selectedStationData, ...pulseCircle }))

  // Function to calculate size based on zoom level
  const getSizeMultiplier = (zoom) => {
    // Adjust these values to fine-tune the scaling
    const minZoom = 4;
    const maxZoom = 15;
    const minSize = 0.5;
    const maxSize = 5;

    if (zoom <= minZoom) return maxSize;
    if (zoom >= maxZoom) return minSize;

    // Linear interpolation between max and min size
    return maxSize - (maxSize - minSize) * ((zoom - minZoom) / (maxZoom - minZoom));
  }

  const sizeMultiplier = getSizeMultiplier(viewport.zoom);

  const mainStationColor = selectedDirection === 'comingFrom' 
    ? MAIN_STATION_COLOR_ARRIVING 
    : MAIN_STATION_COLOR_DEPARTING;

  const mainStationPulse = new ScatterplotLayer({
    id: 'main-station-pulse-scatterplot-layer',
    data: pulseData,
    pickable: false,
    opacity: 1,
    stroked: true,
    filled: false,
    lineWidthMinPixels: 1,
    getLineWidth: 10 * sizeMultiplier,
    // Always face the camera
    billboard: true,
    getPosition: d => d.position,
    getRadius: d => 50 * d.scale * sizeMultiplier,
    getLineColor: d => [...mainStationColor, d.opacity],
    updateTriggers: {
      getRadius: [pulseData],
      getLineColor: [mainStationColor]
    }
  })

  const mainStationPoint = new ScatterplotLayer({
    id: 'main-station-scatterplot-layer',
    data: [selectedStationData],
    pickable: true,
    opacity: 1,
    stroked: false,
    filled: true,
    lineWidthMinPixels: 2,
    getPosition: d => d.position,
    getRadius: 50 * sizeMultiplier,
    getFillColor: mainStationColor,
    // Always face the camera
    billboard: true,
    updateTriggers: {
      getPosition: [selectedStationData],
      getFillColor: [mainStationColor]
    },
    onHover: (info) => {
      if (info.object) {
        const stationName = getStationName(info.object.station_id);
        const totalRidership = filteredData.current.reduce((acc, d) => acc + d.ridership, 0);
        setHoverInfo({
          x: info.x,
          y: info.y,
          stationName,
          stationId: info.object.station_id,
          ridership: totalRidership,
          ridershipLabel: selectedDirection === 'goingTo' ? 'Total departures' : 'Total arrivals',
          showPercentage: false,
          positionedLoosely: true,
        });
      } else {
        setHoverInfo(null);
      }
    }
  })

  return [mainStationPulse, mainStationPoint]
}

const getInitialBarScale = (data, selectedStation) => {
  if (selectedStation === ALL_STATIONS_ID) {
    return 0.0004
  } 

  const maxRidershipToday = Math.max(...data.map(d => d.ridership));
  return 1 / maxRidershipToday
}

const getStationName = (id) => {
  const station = stationIdToStation[id]
  return station ? station.display_name : 'Unknown Station';
};

const View3DToggle = ({ is3D, setViewport }) => {
  const [showExpandedMessage, setShowExpandedMessage] = useState(false);

  const toggleView = () => {
    trackEvent('3d_view_toggled', {
      new_state: !is3D,
    });
    if (is3D) {
      // Switch to 2D view
      setShowExpandedMessage(false);
      setViewport(prevViewport => ({
        ...prevViewport,
        pitch: 0,
        bearing: 0,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      }));
    } else {
      // Switch to 3D view
      setViewport(prevViewport => ({
        ...prevViewport,
        pitch: 45,
        bearing: 0,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      }));
      // Show expanded message
      setShowExpandedMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowExpandedMessage(false), 6000);
    }
  };

  return (
    <button
      className={`view-toggle ${showExpandedMessage ? 'expanded' : ''} ${is3D ? 'active' : ''}`}
      onClick={toggleView}
      aria-label={`Switch to ${is3D ? '2D' : '3D'} view`}
    >
      <div className="view-3d" />
      <span className="expanded-message">Shift + Drag to rotate in 3D</span>
    </button>
  );
};

export default MTADataMap;
