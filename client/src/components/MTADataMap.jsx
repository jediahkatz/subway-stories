// src/components/MTADataMap.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DeckGL, ScatterplotLayer } from 'deck.gl';
import ReactMapGL from 'react-map-gl';
import { stationIdToStation, stations } from '../lib/stations';
import Tooltip from './Tooltip';
import DataControls from './DataControls';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MTADataMap.css';
import { useBarsAnimation } from '../hooks/useBarsAnimation';
import { useDotPulseAnimation } from '../hooks/useDotAnimation';
import { useDebounce } from '../lib/debounce';
import subwayRoutes from '../data/nyc-subway-routes.js';
import subwayLayerStyles from '../lib/subway-layer-styles.js';
import { fetchRidershipByStationFromSqlServer, fetchTotalRidershipFromSqlServer } from '../lib/data-fetcher';
import MapBarLayer from './MapBarLayer';
import { saveStateToSessionStorage, loadStateFromSessionStorage } from '../lib/sessionManager.js';
import ViewTabs from './ViewTabs';
import StoriesView from './StoriesView';
import { FlyToInterpolator } from 'deck.gl';

const NYC_BOUNDS = {
  minLng: -74.2591,  // Southwest longitude
  minLat: 40.4774,   // Southwest latitude
  maxLng: -73.7004,  // Northeast longitude
  maxLat: 40.9176,   // Northeast latitude
  minZoom: 10,
};

const LOADING_BAR_SCALE = 1;
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

const drawSubwayLines = (map) => {
  map.addSource('nyc-subway-routes', {
    type: 'geojson',
    data: subwayRoutes,
  })

  // add layers by iterating over the styles in the array defined in subway-layer-styles.js
  subwayLayerStyles.forEach((style) => {
    map.addLayer(style)
  })
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

  const [data, setData] = useState([]);
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
    return savedState?.selectedMonths || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  });
  const [stationIdToTotalRidershipByHour, setStationIdToTotalRidershipByHour] = useState(null);
  const [showPercentage, setShowPercentage] = useState(() => {
    const savedState = loadStateFromSessionStorage();
    return savedState?.showPercentage || false;
  });

  const maxRidershipToday = React.useMemo(() => Math.max(...data.map(d => d.ridership)), [data]);

  // Sort so that we render stations in correct z-order
  const sortedData = React.useMemo(() =>
    data.sort((a, b) => {
      return b.lat - a.lat;
    })
    , [data]);
  const filteredData = React.useMemo(() => 
    sortedData.filter(d => d.hour === selectedHour)
    , [sortedData, selectedHour]);

  const percentageData = React.useMemo(() => {
    if (!showPercentage || !stationIdToTotalRidershipByHour) return filteredData;

    return filteredData.map(d => {
      const totalRidershipByHour = stationIdToTotalRidershipByHour[d.station_id];
      const totalRidership = totalRidershipByHour ? totalRidershipByHour[d.hour] ?? 0 : 0;
      return {
        ...d,
        percentage: totalRidership > 0 ? 100 * d.ridership / totalRidership : 0,
      }
    })
  }, [filteredData, stationIdToTotalRidershipByHour, showPercentage])

  const barScaleLocked = selectedBarScale !== null;
  const initialBarScale = maxRidershipToday > 0 ? 1 / maxRidershipToday : 1;
  const barScale = 
    barScaleLocked ? selectedBarScale :
    showPercentage ? PERCENTAGE_BAR_SCALE : 
                     initialBarScale;
  
  const { lineData, startAnimation, markCurrentBarHeights } = useBarsAnimation(
    data.length > 0 ? percentageData : stations,
    barScale,
    showPercentage,
    isLoading
  );

  // This is kind of a hack. When we make a change that affects the final rendered bar scale 
  // and requires re-animating, (e.g. changing showPercentage or entering the loading state)
  // there's a one-frame delay when the bar scale is changed, but the new lineData hasn't 
  // been calculated yet. Here we make sure that the bar scale used for the final render is 
  // set based on the data that we're rendering.
  const barScaleForFinalRender =
    lineData.type === 'LOADING'                                 ? LOADING_BAR_SCALE : 
    !barScaleLocked && lineData.type === 'RIDERSHIP'            ? initialBarScale : 
    !barScaleLocked && lineData.type === 'RIDERSHIP_PERCENTAGE' ? PERCENTAGE_BAR_SCALE :
                                                                  barScale;

  const getStationName = (id) => {
    // todo fix this linear search
    const station = stations.find(station => Number(station.complex_id) === Number(id));
    return station ? station.display_name : 'Unknown Station';
  };

  const handleHourChange = React.useCallback((newHour) => {
    markCurrentBarHeights(barScale, showPercentage);
    setSelectedHour(newHour);
    startAnimation();
  }, [selectedHour, startAnimation]);

  const handleShowPercentageChange = React.useCallback((shouldShowPercentage) => {
    markCurrentBarHeights(barScale, showPercentage);
    setShowPercentage(shouldShowPercentage)
    startAnimation();
  }, [showPercentage, startAnimation])

  const handleDayChange = React.useCallback((newDay) => {
    markCurrentBarHeights(barScale, showPercentage);
    setSelectedDay(newDay);
    startAnimation();
  }, [barScale, showPercentage, startAnimation])

  const handleDirectionChange = React.useCallback((newDirection) => {
    markCurrentBarHeights(barScale, showPercentage);
    setSelectedDirection(newDirection);
    startAnimation();
  }, [barScale, showPercentage, startAnimation])

  const handleStationChange = React.useCallback((newStation) => {
    markCurrentBarHeights(barScale, showPercentage);
    setSelectedStation(newStation);
    startAnimation();
  }, [barScale, showPercentage, startAnimation])

  const handleMonthsChange = React.useCallback(useDebounce((newMonths) => {
    markCurrentBarHeights(barScale, showPercentage);
    setSelectedMonths(newMonths);
    startAnimation();
  }, 1000), [barScale, showPercentage, startAnimation])

  useEffect(() => {
    setIsLoading(true);
    const abortController = new AbortController();
    const loadData = async () => {
      let abortedDueToAnotherLoad = false;
      try {
        const [processedData, stationIdToTotalRidership] = await Promise.all([
          fetchRidershipByStationFromSqlServer(selectedDay, selectedStation, selectedDirection, selectedMonths, abortController.signal),
          showPercentage ? fetchTotalRidershipFromSqlServer(selectedDay, selectedMonths, selectedDirection, abortController.signal) : null
        ]);

        setData(processedData);
        setStationIdToTotalRidershipByHour(stationIdToTotalRidership);
        setIsLoading(false);
        startAnimation();

      } catch (error) {
        if (error.name === 'AbortError') {
          abortedDueToAnotherLoad = true;
        } else {
          console.error('Failed to load data:', error);
        }
      } finally {
        if (!abortedDueToAnotherLoad) {
          setIsLoading(false);
          startAnimation();
        }
      }
    };
    loadData();
    return () => abortController.abort();
  }, [selectedDay, selectedStation, selectedDirection, selectedMonths, showPercentage]);

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
  
  const mapBarLayer = new MapBarLayer({
    id: 'ridership-composite-layer',
    data: lineData.data,
    pickable: true,
    getBasePosition: d => [d.lon, d.lat],
    getHeight: d => d.targetHeight * barScaleForFinalRender,
    getWidth: _d => 50,
    getColor: d => {
      const color = d.color ?? getColorAbsolute(d.ridership);
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
      data: [data],
      getColor: [data],
      getHeight: [barScale, data],
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
        const totalRidership = filteredData.reduce((acc, d) => acc + d.ridership, 0);
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
  const [activeView, setActiveView] = useState('stories'); // Set initial view to 'stories'
  
  return (
    <div className="map-container">
      <ViewTabs activeView={activeView} setActiveView={setActiveView} />
      <DeckGL
        viewState={viewport}
        controller={true}
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
            const map = e.target
            drawSubwayLines(map)
          }}
        />
      </DeckGL>
      {activeView === 'visualization' && (
        <>
          <DataControls
            selectedHour={selectedHour}
            setSelectedHour={handleHourChange}
            selectedDay={selectedDay}
            setSelectedDay={handleDayChange}
            selectedStation={selectedStation}
            setSelectedStation={handleStationChange}
            selectedDirection={selectedDirection}
            setSelectedDirection={handleDirectionChange}
            barScale={barScale}
            setSelectedBarScale={setSelectedBarScale}
            initialBarScale={initialBarScale}
            selectedMonths={selectedMonths}
            setSelectedMonths={handleMonthsChange}
            showPercentage={showPercentage}
            setShowPercentage={handleShowPercentageChange}
          />
          {hoverInfo && (
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
        </>
      )}
      {activeView === 'stories' && <StoriesView setViewport={setViewport} />}
    </div>
  );
};

export default MTADataMap;