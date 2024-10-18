import { useRef } from 'react';
import { fetchRidershipByStationFromSqlServer, fetchTotalRidershipFromSqlServer } from '../lib/data-fetcher';
import { ALL_STATIONS_ID } from '../lib/all-stations';
import { stationIdToStation, stations } from '../lib/stations';

export const useFetchData = () => {
    const abortController = useRef(new AbortController());
    
    const fetchData = async ({
        selectedDay,
        selectedStation,
        selectedDirection,
        selectedMonths,
        showPercentage
    }) => {
        // abort any previous requests
        abortController.current.abort();
        abortController.current = new AbortController();
        const signal = abortController.current.signal;

        if (selectedStation === ALL_STATIONS_ID) {
            const swappedDirection = selectedDirection === 'comingFrom' ? 'goingTo' : 'comingFrom';
            const allStationsData: Record<string, Record<number, number>> = await fetchTotalRidershipFromSqlServer(selectedDay, selectedMonths, swappedDirection, signal);
            const processedData = stations.flatMap(({ complex_id: station_id }) => {
                const hourToTotalRidership = allStationsData[station_id];
                return Object.entries(hourToTotalRidership).map(([hour, totalRidership]) => {
                    return {    
                        station_id,
                        hour: Number(hour),
                        ridership: totalRidership,
                        lon: stationIdToStation[station_id].lon,
                        lat: stationIdToStation[station_id].lat,
                        percentage: 0
                    }
                })
            });

            return { processedData, stationIdToTotalRidership: null };
        }

        const [processedData, stationIdToTotalRidership] = await Promise.all([
            fetchRidershipByStationFromSqlServer(selectedDay, selectedStation, selectedDirection, selectedMonths, signal),
            showPercentage ? fetchTotalRidershipFromSqlServer(selectedDay, selectedMonths, selectedDirection, signal) : null
        ]);

        return { processedData, stationIdToTotalRidership };
    }

    return { fetchData };
}