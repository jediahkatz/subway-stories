import stationsData from '../data/stations.json';

/** Load data about all subway station complexes. */
const getStationsHelper = () => {
  const stationIdToStation = {};
  for (const station of stationsData) {
    stationIdToStation[station.complex_id] = station;
  }
  return stationIdToStation;
};
 

export const stationIdToStation = getStationsHelper();
export const stations = stationsData;
