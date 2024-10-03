// src/components/MTADataMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DeckGL, ColumnLayer, ScatterplotLayer } from 'deck.gl';
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
  const [prevSelectedHour, setPrevSelectedHour] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedStation, setSelectedStation] = useState('126');
  const [selectedDirection, setSelectedDirection] = useState('goingTo');
  const [isLoading, setIsLoading] = useState(false);

  const maxRidershipToday = Math.max(...data.map(d => d.ridership));
  const minRidershipToday = Math.min(...data.map(d => d.ridership));

  const sortedData = React.useMemo(() =>
    data.sort((a, b) => {
      return b.dlat - a.dlat;
    })
    , [data]);
  const filteredData = React.useMemo(() => 
    sortedData.filter(d => d.hour === selectedHour)
    , [sortedData, selectedHour]);
  const filteredPrevData = React.useMemo(() => 
    sortedData.filter(d => d.hour === prevSelectedHour)
    , [sortedData, prevSelectedHour]);

  const { scatterPlotPoints, startAnimation } = useRidershipAnimation(
    filteredData,
    filteredPrevData,
    minRidershipToday,
    maxRidershipToday,
    isLoading
  );

  const getStationName = (id) => {
    // todo fix this linear search
    const station = stations.find(station => Number(station.complex_id) === Number(id));
    return station ? station.display_name : 'Unknown Station';
  };

  const handleHourChange = React.useCallback((newHour) => {
    setPrevSelectedHour(selectedHour);
    setSelectedHour(newHour);
    startAnimation();
  }, [selectedHour, startAnimation]);

  useEffect(() => {
    handleHourChange(0);
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const processedData = await fetchData(selectedDay, selectedStation, selectedDirection);
        setData(processedData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
        startAnimation(); // Start animation when loading is complete
      }
    };
    loadData();
  }, [selectedDay, selectedStation, selectedDirection]);

  const scatterplotLayer = new ScatterplotLayer({
    id: 'ridership-scatterplot-layer',
    data: scatterPlotPoints,
    pickable: true,
    opacity: 1,
    stroked: false,
    filled: true,
    lineWidthMinPixels: 1,
    getPosition: d => d.position,
    getRadius: 30,
    getFillColor: d => d.color, // Use the color from the scatter plot points
    updateTriggers: {
      getPosition: [selectedHour, selectedDay, selectedStation, selectedDirection],
      getFillColor: [selectedHour, selectedDay, selectedStation, selectedDirection, isLoading]
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
      />
      <DeckGL
        initialViewState={viewport}
        controller={true}
        layers={[scatterplotLayer, mainStationPoint]}
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