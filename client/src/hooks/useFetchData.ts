import { useRef } from 'react';
import { fetchRidershipByStationFromSqlServer, fetchTotalRidershipFromSqlServer } from '../lib/data-fetcher';

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

        const [processedData, stationIdToTotalRidership] = await Promise.all([
            fetchRidershipByStationFromSqlServer(selectedDay, selectedStation, selectedDirection, selectedMonths, signal),
            showPercentage ? fetchTotalRidershipFromSqlServer(selectedDay, selectedMonths, selectedDirection, signal) : null
        ]);

        return { processedData, stationIdToTotalRidership };
    }

    return { fetchData };
}