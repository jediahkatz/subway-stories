import { ALL_MONTHS } from "../components/StoriesView";
import { ALL_STATIONS_ID } from "../lib/all-stations";

export const gifDataview = {
  station: ALL_STATIONS_ID,
  direction: 'comingFrom',
  day: 'Wednesday',
  visibleLines: undefined,
  hour: 0, // Changed from 18 to 0 to start at beginning of day
  months: ALL_MONTHS,
  barScale: 0.005,
  viewport: {
    latitude: 40.692259, // Updated to Jay St-MetroTech coordinates
    longitude: -73.986642,
    zoom: 13.5,
  },
  animate: {
    field: 'hour', // Changed from months to hour
    frames: [
      { value: 0, duration: 500 },
      { value: 1, duration: 500 },
      { value: 2, duration: 500 },
      { value: 3, duration: 500 },
      { value: 4, duration: 500 },
      { value: 5, duration: 500 },
      { value: 6, duration: 500 },
      { value: 7, duration: 500 },
      { value: 8, duration: 500 },
      { value: 9, duration: 500 },
      { value: 10, duration: 500 },
      { value: 11, duration: 500 },
      { value: 12, duration: 500 },
      { value: 13, duration: 500 },
      { value: 14, duration: 500 },
      { value: 15, duration: 500 },
      { value: 16, duration: 500 },
      { value: 17, duration: 500 },
      { value: 18, duration: 500 },
      { value: 19, duration: 500 },
      { value: 20, duration: 500 },
      { value: 21, duration: 500 },
      { value: 22, duration: 500 },
      { value: 23, duration: 2000 }
    ],
    type: 'linear',
  },
  formatInfoBarText: ({ selectedHours, animatingField }) => {
    if (selectedHours) {
      const hour = selectedHours
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:00 ${period}`
    }
  }
}; 