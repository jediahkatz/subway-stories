import { useState, useEffect } from 'react';

/** Load data about all subway station complexes. Only runs once. */
export const useStations = () => {
  const [stations, setStations] = useState({});

  useEffect(() => {
    const fetchStations = async () => {
      const url = new URL("https://data.ny.gov/resource/5f5g-n3cz.json");
      const params = {
        "$select": "complex_id, display_name, latitude as lat, longitude as lon",
        "$where": "borough!='SI'",
        "$limit": 10000
      };

      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      try {
        const start = Date.now();
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Network response was not ok:\n${JSON.stringify(await response.json())}`);
        }
        console.log(`Successfully fetched station data in ${Date.now() - start} ms`);
        const data = await response.json();

        const stationIdToStation = {};
        for (const station of data) {
          stationIdToStation[station.complex_id] = station
        }
        setStations(stationIdToStation);
      } catch (error) {
        console.error('Error fetching station data:', error);
      }
    };

    fetchStations();
  }, []);

  return stations;
};

export default useStations;
