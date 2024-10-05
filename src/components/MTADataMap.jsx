// src/components/MTADataMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DeckGL, LineLayer, ScatterplotLayer } from 'deck.gl';
import { Matrix4 } from '@math.gl/core';
import ReactMapGL from 'react-map-gl';
import { getStations } from '../lib/stations';
import Tooltip from './Tooltip';
import DataControls from './DataControls';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MTADataMap.css';
import { useRidershipAnimation } from '../hooks/useRidershipAnimation';
import subwayRoutes from '../data/nyc-subway-routes.js';
import subwayLayerStyles from '../lib/subway-layer-styles.js';
import { fetchData } from '../lib/data-fetcher';
import MapBarLayer from './MapBarLayer';

const NYC_BOUNDS = {
  minLng: -74.2591,  // Southwest longitude
  minLat: 40.4774,   // Southwest latitude
  maxLng: -73.7004,  // Northeast longitude
  maxLat: 40.9176,   // Northeast latitude
  minZoom: 10,
};

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
    zoom: constrainedZoom
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
  const [viewport, setViewport] = useState({
    latitude: 40.700292,
    longitude: -73.925618,
    zoom: 12,
    bearing: 0,
    pitch: 0,
    width: '100vw',
    height: '100vh',
  });

  const stationIdToStations = getStations();
  const stations = Object.values(stationIdToStations);
  const [data, setData] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedStation, setSelectedStation] = useState('126');
  const [selectedDirection, setSelectedDirection] = useState('goingTo');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBarScale, setSelectedBarScale] = useState(null); // number | null (default)

  const maxRidershipToday = React.useMemo(() => Math.max(...data.map(d => d.ridership)), [data]);

  const sortedData = React.useMemo(() =>
    data.sort((a, b) => {
      return b.lat - a.lat;
    })
    , [data]);
  const filteredData = React.useMemo(() => 
    sortedData.filter(d => d.hour === selectedHour)
    , [sortedData, selectedHour]);

    const barScaleLocked = selectedBarScale !== null;
    const initialBarScale = 1 / maxRidershipToday;
    const barScale = barScaleLocked ? selectedBarScale : initialBarScale;

  const { lineData, startAnimation } = useRidershipAnimation(
    filteredData,
    barScale,
    isLoading
  );

  const getStationName = (id) => {
    // todo fix this linear search
    const station = stations.find(station => Number(station.complex_id) === Number(id));
    return station ? station.display_name : 'Unknown Station';
  };

  const handleHourChange = React.useCallback((newHour) => {
    setSelectedHour(newHour);
    startAnimation();
  }, [selectedHour, startAnimation]);

  useEffect(() => {
    handleHourChange(0);
  }, [])

  useEffect(() => {
    setIsLoading(true);
    const abortController = new AbortController();
    const loadData = async () => {
      let aborted = false;
      try {
        const processedData = await fetchData(selectedDay, selectedStation, selectedDirection, abortController.signal);
        setData(processedData);
      } catch (error) {
        if (error.name === 'AbortError') {
          aborted = true;
        } else {
          console.error('Failed to load data:', error);
        }
      } finally {
        if (!aborted) {
          setIsLoading(false);
          startAnimation();
        }
      }
    };
    loadData();
    return () => abortController.abort();
  }, [selectedDay, selectedStation, selectedDirection]);

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
    data: lineData,
    pickable: true,
    getBasePosition: d => [d.lon, d.lat],
    getHeight: d => isLoading ? d.targetHeight : d.targetHeight * barScale,
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
          ridership: info.object.ridership
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

  const selectedStationData = stationIdToStations[selectedStation]
  const mainStationPoint = new ScatterplotLayer({
    id: 'main-station-scatterplot-layer',
    data: selectedStationData ? 
      [{ station_id: selectedStation, position: [Number(selectedStationData.lon), Number(selectedStationData.lat)] }]
      : [],
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
          ridershipLabel: selectedDirection === 'goingTo' ? 'Total departures' : 'Total arrivals'
        });
      } else {
        setHoverInfo(null);
      }
    }
  })

  return (
    <div className="map-container">
      <DataControls
        selectedHour={selectedHour}
        setSelectedHour={handleHourChange}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        selectedDirection={selectedDirection}
        setSelectedDirection={setSelectedDirection}
        barScale={barScale}
        setSelectedBarScale={setSelectedBarScale}
        initialBarScale={1 / maxRidershipToday}
      />
      <DeckGL
        initialViewState={viewport}
        controller={true}
        layers={[mapBarLayer, mainStationPoint]}
        onViewStateChange={({viewState}) => {
          const constrained = constrainViewState({viewState})
          setViewport(constrained);
          return constrained;
        }}
      >
        <ReactMapGL
          {...viewport}
          mapboxAccessToken={mapboxToken}
          // todo - transition between light & dark styles by rendering both and fading in/out?
          mapStyle="mapbox://styles/mapbox/dark-v11"
          controller={true}
          onLoad={(e) => {
            const map = e.target
            drawSubwayLines(map)
          }}
        />
      </DeckGL>
      {hoverInfo && (
        <Tooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          stationName={`${hoverInfo.stationName} (${hoverInfo.stationId})`}
          ridership={hoverInfo.ridership}
          ridershipLabel={hoverInfo.ridershipLabel}
        />
      )}
    </div>
  );
};

export default MTADataMap;