import React, { useEffect, useRef, useCallback } from 'react';
import scrollama from 'scrollama';
import './StoriesView.css';
import { FlyToInterpolator } from 'deck.gl';

export const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const stories = [
  {
    title: 'A Tale of Five Chinatowns',
    description: <>
      “They go in the morning for Dim Sum,” explains Anna Li, 26(?), when I ask her why hundreds of people flock from her neighborhood, Bensonhurst, to Manhattan's Chinatown at 8 a.m. every Saturday. Bensonhurst and Sunset Park, where Anna grew up, house the two largest Chinese communities in Brooklyn. Although younger generations of Chinese are choosing more and more to settle away from the din of Manhattan, the original Chinatown is still a crucial gathering-place for the community.
    </>,
    viewport: { longitude: -73.990, latitude: 40.651, zoom: 11.35, bearing: 0, pitch: 0 },
    dataview: {
      station: '231', // Grand St (B D)
      direction: 'comingFrom',
      day: 'Saturday',
      hour: 8,
      months: ALL_MONTHS,
      visibleLines: ['B', 'D', 'N', 'F', 'R', 'Q'],
    },
  },
  {
    description: <>
      In high school, Anna often took the (D) into the city on Saturdays, too, to hang out and play volleyball in Seward Park. Plenty of her friends had part-time jobs in the neighborhood. And without cars, it was easier and more stimulating to meet downtown. Even the adults, who primarily drove in Brooklyn, would take the train into Chinatown, in order to attend to business and call on older family. “The elders who live in Chinatown, we don't make them come to us. We come to them.”
    </>,
    viewport: { longitude: -73.990, latitude: 40.651, zoom: 11.35, bearing: 0, pitch: 0 },
    dataview: {
      station: '231', // Grand St (B D)
      direction: 'comingFrom',
      day: 'Saturday',
      hour: 8,
      months: ALL_MONTHS,
      visibleLines: ['D'],
    },
  },
  {
    description: <>
      The Brooklyn Chinese aren't the only ones coming into Chinatown on the weekend. A smaller but determined set makes an even longer trek from Flushing, Queens, transferring from the (7) line. [maybe one sentence here?] Home to the largest Chinatown outside of Asia, the neighborhood has become a destination in its own right.
    </>,
    viewport: { longitude: -73.90, latitude: 40.754, zoom: 11.68, bearing: 0, pitch: 0 },
    dataview: {
      station: '231', // Grand St (B D)
      direction: 'comingFrom',
      day: 'Saturday',
      hour: 8,
      months: ALL_MONTHS,
      visibleLines: ['7', '6', 'D', 'N']
    },
  },
  {
    description: <>
      Increasingly crowded and prosperous, Flushing is now the fourth largest business district in New York City. During rush hour, a surge of nurses, teachers, accountants, and retail workers pour in. Many of them hail from satellite enclaves of mainland Chinese in Elmhurst/Corona. Much of the chatter one hears in Flushing is in Mandarin, compared to the Cantonese of Chinatowns in Manhattan and Bensonhurst.
    </>,
    viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
    dataview: {
      station: '447', // Flushing-Main St (7)
      direction: 'comingFrom',
      day: 'Monday',
      hour: 7,
      months: ALL_MONTHS,
      visibleLines: ['7']
    },
  },
  {
    description: <>
      On the weekend, straphangers pour back into Flushing for another reason: the food. [name some restaurants or cuisines]. Restaurant workers are out the door first at 7 and 8 a.m. For lunch and dinner, the Corona crowd is joined by a new set of younger, affluent Chinese from Long Island City. While LIC isn't a Chinatown in its own right, its population has swelled with tech workers, who seek modern amenities and proximity to both Flushing and Midtown.
    </>,
    viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
    dataview: {
      station: '447', // Flushing-Main St (7)
      direction: 'comingFrom',
      day: 'Saturday',
      hour: 11,
      months: ALL_MONTHS,
      visibleLines: ['7']
    },
  }
];

const StoriesView = React.memo(({ 
  setViewport, 
  setSelectedStation, 
  setSelectedDirection, 
  setSelectedDay, 
  setSelectedHour, 
  setSelectedMonths, 
  setSelectedBarScale,
  limitVisibleLines,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(scrollama());

  const handleStepEnter = useCallback((response) => {
    const { index } = response;

    setViewport({
      ...stories[index].viewport,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });
    setSelectedStation(stories[index].dataview.station);
    setSelectedDirection(stories[index].dataview.direction);
    setSelectedDay(stories[index].dataview.day);
    setSelectedHour(stories[index].dataview.hour);
    limitVisibleLines(stories[index].dataview.visibleLines);
    setSelectedMonths(stories[index].dataview.months);
  }, [setViewport, setSelectedStation, setSelectedDirection, setSelectedDay, setSelectedHour, setSelectedMonths]);

  useEffect(() => {
    scrollerRef.current
      .setup({
        step: '.stories-box',
        offset: 0.5,
      })
      .onStepEnter(handleStepEnter);
  }, [handleStepEnter]);

  return (
    <div className="stories-view-container" ref={containerRef}>
      {stories.map((story, index) => (
        <div key={index} className="stories-box">
          {story.title && <h2>{story.title}</h2>}
          <p>
            {story.description}
          </p>
        </div>
      ))}
    </div>
  );
});

export default StoriesView;
