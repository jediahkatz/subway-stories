// src/components/MTADataMap.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DeckGL, ScatterplotLayer } from 'deck.gl';
import ReactMapGL from 'react-map-gl';
import { stationIdToStation, stations } from '../lib/stations';
import Tooltip from './Tooltip';
import DataControls from './DataControls';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MTADataMap.css';
import { useBarsAnimation } from '../hooks/useBarsAnimation';
import { useDotPulseAnimation } from '../hooks/useDotAnimation';
import subwayRoutes from '../data/nyc-subway-routes.js';
import subwayLayerStyles from '../data/subway-layer-styles.js';
import MapBarLayer from './MapBarLayer';
import { saveStateToSessionStorage, loadStateFromSessionStorage } from '../lib/sessionManager.js';
import ViewTabs from './ViewTabs';
import StoriesView, { ALL_MONTHS } from './StoriesView';
import { FlyToInterpolator } from 'deck.gl';
import { useFetchData } from '../hooks/useFetchData';
import { useBarsAnimation2 } from '../hooks/useBarsAnimation2';
import { getAbsoluteHeight } from '../lib/bar-heights';
import { usePrevious } from '../hooks/usePrevious';

const NYC_BOUNDS = {
  minLng: -74.2591,  // Southwest longitude
  minLat: 40.4774,   // Southwest latitude
  maxLng: -73.7004,  // Northeast longitude
  maxLat: 40.9176,   // Northeast latitude
  minZoom: 10,
};

const LOADING_COLOR = [204, 204, 255];

const PERCENTAGE_BAR_SCALE = 1 / 25;

function constrainViewState({viewState}) {
  const {longitude, latitude, zoom} = viewState;

  // Constrain longitude and latitude to NYC bounds
  const constrainedLongitude = Math.max(Math.min(longitude, NYC_BOUNDS.maxLng), NYC_BOUNDS.minLng);
  const constrainedLatitude = Math.max(Math.min(latitude, NYC_BOUNDS.maxLat), NYC_BOUNDS.minLat);
  const constrainedZoom = Math.max(NYC_BOUNDS.minZoom, zoom);

  return {
    ...viewState,
    longitude: constrainedLongitude,
    latitude: constrainedLatitude,
    zoom: constrainedZoom,
    bearing: 0,
    pitch: 0
  };
}

const MTADataMap = ({ mapboxToken }) => {
  const [viewport, setViewport] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.viewport || {
      latitude: 40.700292,
      longitude: -73.925618,
      zoom: 12,
      bearing: 0,
      pitch: 0,
      width: '100vw',
      height: '100vh',
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator(),
    };
  });

  const data = useRef([]);
  const filteredData = useRef(stations.map(s => ({
    station_id: s.complex_id,
    lon: s.lon,
    lat: s.lat,
    ridership: 0,
    percentage: 0,
  })));

  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedHour, setSelectedHour] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedHour || 2;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedDay || 'Saturday';
  });
  const [selectedStation, setSelectedStation] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedStation || '126';
  });
  const [selectedDirection, setSelectedDirection] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.selectedDirection || 'goingTo';
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

  const mapRef = useRef(null);

  const barScaleLocked = useRef(selectedBarScale !== null);
  const maxRidershipToday = useRef(Math.max(...data.current.map(d => d.ridership)));
  const initialBarScale = useRef(maxRidershipToday.current > 0 ? 1 / maxRidershipToday.current : 1);
  const barScale = useRef(
    barScaleLocked ? selectedBarScale :
    showPercentage ? PERCENTAGE_BAR_SCALE : 
                     initialBarScale.current
  );

  const { barData, startAnimation: startBarAnimation, cancelAnimation: cancelBarAnimation } = useBarsAnimation2();
  // This may be bad, if it turns out to be a problem we can recompute it in handleDataSettingsChange
  const previousBarHeights = usePrevious(barData.heights) || Object.fromEntries(stations.map(s => [s.complex_id, { currentHeight: 0 }]));

  const getStationName = (id) => {
    // todo fix this linear search
    const station = stations.find(station => Number(station.complex_id) === Number(id));
    return station ? station.display_name : 'Unknown Station';
  };

  const { fetchData } = useFetchData();

  const handleDataSettingsChange = React.useCallback(async ({ 
    newSelectedDay, 
    newSelectedStation, 
    newSelectedDirection, 
    newSelectedMonths, 
    newSelectedHour, 
    newShowPercentage,
    newSelectedBarScale,
    initialFetch = false,
  }) => {
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
    const shouldCompletePulseAnimationOnce = stationChanged || directionChanged || initialFetch;

    if (dayChanged) setSelectedDay(newSelectedDay);
    if (stationChanged) setSelectedStation(newSelectedStation);
    if (directionChanged) setSelectedDirection(newSelectedDirection);
    if (monthsChanged) setSelectedMonths(newSelectedMonths);
    if (hourChanged) setSelectedHour(newSelectedHour);
    if (showPercentageChanged) setShowPercentage(newShowPercentage);
    if (selectedBarScaleChanged) setSelectedBarScale(newSelectedBarScale);
    
    if (shouldFetchData) {
      console.log('fetching data')
      setIsLoading(true);
      let animationCompletedOncePromise;
      let loadingAnimationStarted = false;
      let abortedDueToAnotherLoad = false;

      // This is kind of shitty GPT code, but it makes sure that unless shouldCompletePulseAnimationOnce is true,
      // we wait 50ms for the data to load before starting the pulse animation (in case it's cached)
      const startLoadingAnimation = () => {
        animationCompletedOncePromise = startBarAnimation({
          type: newSelectedDirection === 'comingFrom' ? 'WAVE_RADIAL_IN' : 'WAVE_RADIAL_OUT',
          centerLocation: [stationIdToStation[newSelectedStation].lon, stationIdToStation[newSelectedStation].lat],
          otherStationLocations: Object.fromEntries(stations.map(d => [d.complex_id, [d.lon, d.lat]]))
        });
        loadingAnimationStarted = true;
      }

      if (shouldCompletePulseAnimationOnce) {
        startLoadingAnimation();
      }

      const animationTimeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          if (!loadingAnimationStarted) {
            startLoadingAnimation();
            loadingAnimationStarted = true;
          }
          resolve();
        }, 50);
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

        maxRidershipToday.current = Math.max(...sortedData.map(d => d.ridership));
        initialBarScale.current = maxRidershipToday.current > 0 ? 1 / maxRidershipToday.current : 1;
        barScale.current = barScaleLocked.current ? newSelectedBarScale :
                               newShowPercentage  ? PERCENTAGE_BAR_SCALE : 
                                                    initialBarScale.current;

        data.current = sortedData;
        if (newShowPercentage) {
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
        initialBarHeights: Object.fromEntries(stations.map(s => [s.complex_id, previousBarHeights[s.complex_id].currentHeight])),
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
    const intervals = [0, 10, 20, 40, 80, 160, 320, 640, 1280];
    const colors = [
      [255, 255, 240], // Light cream
      [240, 220, 200], // Very light tan
      [230, 200, 170], // Light beige
      [220, 180, 150], // Soft tan
      [210, 140, 110], // Warm orange-beige
      [200, 100, 80],  // Muted orange
      [180, 60, 50],   // Deep orange-red
      [140, 40, 30],   // Brick red
      [100, 20, 20]    // Dark brick red
    ];

    let colorIndex = intervals.findIndex(interval => value < interval) - 1;
    if (colorIndex === -2) colorIndex = colors.length - 1; // For values 1280+

    return colors[colorIndex];
  };

  const filteredDataWithStationsAnimatingToZero = useMemo(() => {
    const stationIds = new Set(filteredData.current.map(d => d.station_id));
    const missingStations = stations.filter(s => !stationIds.has(s.complex_id));
    return [...filteredData.current, ...missingStations.map(s => ({
      station_id: s.complex_id,
      ridership: 0,
      percentage: 0,
      lat: s.lat,
      lon: s.lon,
    }))];
  }, [filteredData.current]);

  const mapBarLayer = new MapBarLayer({
    id: 'ridership-composite-layer',
    data: filteredDataWithStationsAnimatingToZero,
    pickable: true,
    getBasePosition: d => [d.lon, d.lat],
    getHeight: d => barData.heights[d.station_id]?.currentHeight ?? 0,
    getWidth: _d => 50,
    getColor: d => {
      const color = barData.type === 'LOADING' ? LOADING_COLOR : getColorAbsolute(d.ridership);
      return [...color, 255];
    },
    onHover: (info) => {
      if (info.object) {
        const stationName = getStationName(info.object.station_id);
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
      getColor: [filteredDataWithStationsAnimatingToZero, barData],
      getHeight: [barScale, filteredDataWithStationsAnimatingToZero, barData],
    }
  });
    
  const selectedStationData = {
    station_id: selectedStation,
    position: [Number(stationIdToStation[selectedStation].lon), Number(stationIdToStation[selectedStation].lat)]
  }

  const pulseCircles = useDotPulseAnimation(selectedDirection);
  const pulseData = pulseCircles.map(pulseCircle => ({ ...selectedStationData, ...pulseCircle }))

  const mainStationPulse = new ScatterplotLayer({
    id: 'main-station-pulse-scatterplot-layer',
    data: pulseData,
    pickable: false,
    opacity: 1,
    stroked: false,
    filled: true,
    lineWidthMinPixels: 1,
    getPosition: d => d.position,
    getRadius: d => 50 * d.scale,
    getFillColor: d => [50, 115, 246, d.opacity],
    updateTriggers: {
      getRadius: [pulseData]
    }
  })

  const mainStationPoint = new ScatterplotLayer({
    id: 'main-station-scatterplot-layer',
    data: [selectedStationData],
    pickable: true,
    opacity: 1,
    stroked: false,
    filled: true,
    lineWidthMinPixels: 1,
    getPosition: d => d.position,
    getRadius: 50,
    getFillColor: [50, 115, 246],
    updateTriggers: {
      getPosition: [selectedStationData]
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
        });
      } else {
        setHoverInfo(null);
      }
    }
  })

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
    };
    saveStateToSessionStorage(stateToSave);
  }, [viewport, selectedHour, selectedDay, selectedStation, selectedDirection, selectedMonths, showPercentage]);

  // Add new state for active view
  const [activeView, setActiveView] = useState('visualization');
  
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

  const limitVisibleLines = useCallback((visibleLines) => {

    const map = mapRef.current
    subwayLayerStyles.forEach((style) => {
      const layerId = `subway-line-${style.id}`;

      if (!visibleLines) {
        map.setFilter(layerId, style.filter)
      } else {
        map.setFilter(layerId, [
          'all',
          [...style.filter],
          ['any',
            ...visibleLines.map(line => ['in', line, ['get', 'symbols']]),
          ]
        ]);
      }
    });
  }, [])

  return (
    <div className="map-container">
      <ViewTabs activeView={activeView} setActiveView={setActiveView} limitVisibleLines={limitVisibleLines} />
      <DeckGL
        viewState={viewport}
        controller={activeView === 'visualization' ? true : { scrollZoom: false }}
        layers={[mainStationPulse, mainStationPoint, mapBarLayer]}
        onViewStateChange={({viewState}) => {
          const constrained = constrainViewState({viewState})
          setViewport(constrained);
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
          }}
        />
      </DeckGL>
      {activeView === 'visualization' && 
        <DataControls
          selectedHour={selectedHour}
          setSelectedHour={(hour) => handleDataSettingsChange({ newSelectedHour: hour })}
          selectedDay={selectedDay}
          setSelectedDay={(day) => handleDataSettingsChange({ newSelectedDay: day })}
          selectedStation={selectedStation}
          setSelectedStation={(station) => handleDataSettingsChange({ newSelectedStation: station })}
          selectedDirection={selectedDirection}
          setSelectedDirection={(direction) => handleDataSettingsChange({ newSelectedDirection: direction })}
          barScale={barScale.current}
          setSelectedBarScale={(scale) => handleDataSettingsChange({ newSelectedBarScale: scale })}
          initialBarScale={initialBarScale.current}
          selectedMonths={selectedMonths}
          setSelectedMonths={(months) => handleDataSettingsChange({ newSelectedMonths: months })}
          showPercentage={showPercentage}
          setShowPercentage={(shouldShowPercentage) => handleDataSettingsChange({ newShowPercentage: shouldShowPercentage })}
        />
      }
      {activeView === 'stories' && <StoriesView 
        setViewport={setViewport}
        handleDataSettingsChange={handleDataSettingsChange}
        limitVisibleLines={limitVisibleLines}
        selectedStation={selectedStation}
        selectedDirection={selectedDirection}
        selectedDay={selectedDay}
        selectedHour={selectedHour}
        selectedMonths={selectedMonths}
      />}
      {hoverInfo && !isLoading && (
        <Tooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          stationName={`${hoverInfo.stationName} (${hoverInfo.stationId})`}
          ridership={hoverInfo.ridership}
          percentage={hoverInfo.showPercentage ? hoverInfo.percentage : null}
          ridershipLabel={hoverInfo.ridershipLabel}
          percentageLabel={hoverInfo.percentageLabel}
        />
      )}
    </div>
  );
};

export default MTADataMap;
