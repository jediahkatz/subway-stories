const cache = new Map();

const fetchData = async (selectedDay, selectedStation, selectedDirection) => {
  const cacheKey = `${selectedDay}-${selectedStation}-${selectedDirection}`;
  
  if (cache.has(cacheKey)) {
    console.log('Returning cached data');
    return cache.get(cacheKey);
  }

  const complexId = selectedStation;
  const baseUrl = "https://data.ny.gov/resource/jsu2-fbtj.json";
  const params = {
    $where: selectedDirection === 'goingTo'
      ? `origin_station_complex_id=${complexId} AND day_of_week='${selectedDay}'`
      : `destination_station_complex_id=${complexId} AND day_of_week='${selectedDay}'`,
    $select: selectedDirection === 'goingTo'
      ? "destination_station_complex_id as station_id, hour_of_day as hour, avg(estimated_average_ridership) as ridership, destination_latitude as lat, destination_longitude as lon"
      : "origin_station_complex_id as station_id, hour_of_day as hour, avg(estimated_average_ridership) as ridership, origin_latitude as lat, origin_longitude as lon",
    $group: "station_id,hour,lat,lon",
    $limit: "100000"
  };
  const queryString = new URLSearchParams(params).toString();
  const url = `${baseUrl}?${queryString}`;

  try {
    const start = Date.now();
    const response = await fetch(url);
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`Network response was not ok:\n${JSON.stringify(errorResponse, null, 2)}`);
    }
    console.log(`Successfully fetched origin-destination (${selectedDay}, ${selectedStation}, ${selectedDirection}) data in ${Date.now() - start} ms`);
    const result = await response.json();

    const processedData = result
      .map(item => ({
        ...item,
        ridership: Number(item.ridership),
        lat: Number(item.lat),
        lon: Number(item.lon),
        hour: Number(item.hour),
      }));

    // cache.set(cacheKey, processedData);
    console.log('Cache memory usage:', getCacheMemoryUsageInBytes(), cache.size);
    return processedData;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};

const getCacheMemoryUsageInBytes = () => {
  let total = 0;
  for (const value of cache.values()) {
    total += JSON.stringify(value).length;
  }
  return total;
};

export { fetchData };