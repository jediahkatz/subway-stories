export const gifDataview = {
  station: '225', // Rockefeller Center
  direction: 'comingFrom',
  day: 'Wednesday',
  visibleLines: undefined,
  hour: 18,
  months: [0],
  barScale: 0.005,
  viewport: {
    latitude: 40.756,
    longitude: -73.989,
    zoom: 13.5,
  },
  animate: {
    field: 'months',
    frames: [
      { value: [0], duration: 1000 },
      { value: [1], duration: 500 },
      { value: [2], duration: 500 },
      { value: [3], duration: 500 },
      { value: [4], duration: 500 },
      { value: [5], duration: 500 },
      { value: [6], duration: 500 },
      { value: [7], duration: 500 },
      { value: [8], duration: 500 },
      { value: [9], duration: 500 },
      { value: [10], duration: 500 },
      { value: [11], duration: 2000 }
    ],
    type: 'linear',
  },
  formatInfoBarText: ({ selectedMonths, animatingField }) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    if (selectedMonths.length === 1) {
      const monthText = animatingField === 'months' 
        ? monthNames[selectedMonths[0]]
        : monthNames[selectedMonths[0]]
        return monthText
    }
  }
}; 