// src/components/MTADataMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DeckGL, ColumnLayer, ScatterplotLayer } from 'deck.gl';
import { Matrix4 } from '@math.gl/core';
import ReactMapGL from 'react-map-gl';
import { useStations } from '../hooks/useStations';
import Tooltip from './Tooltip';
import DataControls from './DataControls';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MTADataMap.css';

const ANIMATE_HOUR_CHANGE_DURATION = 500;

const getColor = (value, min, max) => {
  const colorscale = [
    [210, 180, 140],
    [255, 0, 0],
  ];
  const normalizedValue = (value - min) / (max - min);
  const [r, g, b] = colorscale[0].map((c, i) => c + normalizedValue * (colorscale[1][i] - c));
  return [r, g, b];
};

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

  const stationIdToStations = useStations();
  const stations = Object.values(stationIdToStations);
  const [data, setData] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [prevSelectedHour, setPrevSelectedHour] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedStation, setSelectedStation] = useState('126');
  const [selectedDirection, setSelectedDirection] = useState('goingTo');
  const [animationStart, setAnimationStart] = useState(null);
  const animationFrameRef = useRef(null);
  const [scatterPlotPoints, setScatterPlotPoints] = useState([]);

  const getStationName = (id) => {
    // todo fix this linear search
    const station = stations.find(station => Number(station.complex_id) === Number(id));
    return station ? station.display_name : 'Unknown Station';
  };

  const handleHourChange = React.useCallback((newHour, prevHour) => {
    setPrevSelectedHour(prevHour)
    setSelectedHour(newHour);
    setAnimationStart(() => Date.now());
  }, []);

  useEffect(() => {
    handleHourChange(0, 0);
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const complexId = selectedStation;
      const baseUrl = "https://data.ny.gov/resource/jsu2-fbtj.json";
      const params = {
        $where: selectedDirection === 'goingTo'
          ? `origin_station_complex_id=${complexId} AND day_of_week='${selectedDay}'`
          : `destination_station_complex_id=${complexId} AND day_of_week='${selectedDay}'`,
        $select: selectedDirection === 'goingTo'
          ? "destination_station_complex_id as station_id, hour_of_day as hour, sum(estimated_average_ridership) as ridership, destination_latitude as dlat, destination_longitude as dlong"
          : "origin_station_complex_id as station_id, hour_of_day as hour, sum(estimated_average_ridership) as ridership, origin_latitude as dlat, origin_longitude as dlong",
        $group: "station_id,hour,dlat,dlong",
        $limit: 100000
      };
      const queryString = new URLSearchParams(params).toString();
      const url = `${baseUrl}?${queryString}`;

      try {
        const start = Date.now();
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Network response was not ok:\n${JSON.stringify(await response.json(), 2)}`);
        }
        console.log(`Successfully fetched origin-destination data in ${Date.now() - start} ms`);
        const result = await response.json();

        const processedData = result
          .map(item => ({
            ...item,
            ridership: Number(item.ridership),
            dlat: Number(item.dlat),
            dlong: Number(item.dlong),
            hour: Number(item.hour),
          }))

        setData(processedData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [selectedDay, selectedStation, selectedDirection]);

  const maxRidershipToday = Math.max(...data.map(d => d.ridership));
  const minRidershipToday = Math.min(...data.map(d => d.ridership));

  const HEIGHT_COEFF = 500;
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
  
  const stationIdToPrevRidership = React.useMemo(() => 
    filteredPrevData.reduce((acc, d) => {
      acc[d.station_id] = d.ridership;
      return acc;
    }, {})
  , [filteredPrevData]);

  // Animation function
  const animateHeight = (duration) => {
    const startTime = animationStart;

    const step = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Normalize progress (0 to 1)

      // Update scatter points with the current height
      const scatterPoints = filteredData.flatMap((d) => {
        if (d.ridership < 1) {
          return [] // todo: animate to 0?
        }
        const normalizedRidership = d.ridership / maxRidershipToday;
        const targetHeight = Math.floor(normalizedRidership * HEIGHT_COEFF);
        
        const prevRidership = stationIdToPrevRidership[d.station_id] ?? 0;
        const prevHeight = Math.floor(prevRidership / maxRidershipToday * HEIGHT_COEFF);

        const linear = (t) => t;
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easeInOutQuart = (t) => {
          return t < 0.5
            ? 8 * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 4) / 2;
        };

        const currentHeight = Math.floor(prevHeight + (targetHeight - prevHeight) * easeInOutQuart(progress));
        const points = [];
        for (let i = 0; i < currentHeight; i++) {
          const opacity = (0.1 + 0.9 * (i / currentHeight)) * 255;
          points.push({
            position: [d.dlong, d.dlat + 0.00005 * i],
            opacity,
            ...d,
          });
        }
        return points;
      });

      setScatterPlotPoints(scatterPoints); // Set updated points

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step); // Continue animation
      }
    };
    animationFrameRef.current = requestAnimationFrame(step); // Start animation
  };

  useEffect(() => {
    if (animationStart) {
      // Start the animation when selectedHour changes
      animateHeight(ANIMATE_HOUR_CHANGE_DURATION); // duration is 200ms
    }
    return () => {
      // Cleanup animation frame on component unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationStart, data]);

  // const columnLayer = new ColumnLayer({
  //   id: 'ridership-column-layer',
  //   data: filteredData,
  //   diskResolution: 12,
  //   radius: 60,
  //   extruded: true,
  //   pickable: true,
  //   elevationScale: 1,
  //   getPosition: d => [d.dlong, d.dlat],
  //   getFillColor: d => getColor(d.ridership, minRidershipToday, maxRidershipToday),
  //   getLineColor: [0, 0, 0],
  //   getElevation: d =>(d.ridership / d.maxRidership) * 50,
  //   highlightColor: [0, 0, 0, 0],
  //   autoHighlight: false,
  //   modelMatrix: new Matrix4().rotateX(-0.01),
  //   onHover: (info) => {
  //     if (info.object) {
  //       const stationName = getStationName(info.object.station_id);
  //       setHoverInfo({
  //         x: info.x,
  //         y: info.y,
  //         stationName,
  //         ridership: info.object.ridership
  //       });
  //     } else {
  //       setHoverInfo(null);
  //     }
  //   }
  // });

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
    getFillColor: d => {
      const color = getColor(d.ridership, minRidershipToday, maxRidershipToday)
      return [...color, d.opacity]
    },
    updateTriggers: {
      getPosition: [selectedHour, selectedDay, selectedStation, selectedDirection]
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
        onViewStateChange={({ viewState }) => setViewport(viewState)}
      >
        <ReactMapGL
          {...viewport}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/light-v11"
          controller={true}
        />
      </DeckGL>
      {hoverInfo && (
        <Tooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          stationName={`${hoverInfo.stationName} (${hoverInfo.stationId})`}
          ridership={hoverInfo.ridership}
        />
      )}
    </div>
  );
};

export default MTADataMap;