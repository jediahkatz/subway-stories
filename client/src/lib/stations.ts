import stationsData from '../data/stations.json';

/** Load data about all subway station complexes. */
export const getStations = () => {
  const stationIdToStation = {};
  for (const station of stationsData) {
    stationIdToStation[station.complex_id] = station;
  }
  return stationIdToStation;
};

export default getStations;
