import React, { useEffect, useRef, useCallback } from 'react';
import scrollama from 'scrollama';
import './StoriesView.css';

const stories = [
  {
    title: 'Subway Stories',
    viewport: { longitude: -73.98, latitude: 40.75, zoom: 11, bearing: 0, pitch: 0 }
  },
  {
    title: 'Rush Hour Tales',
    viewport: { longitude: -74.00, latitude: 40.72, zoom: 13, bearing: 0, pitch: 0 }
  },
  {
    title: 'Underground Encounters',
    viewport: { longitude: -73.96, latitude: 40.78, zoom: 12, bearing: 0, pitch: 0 }
  },
  {
    title: 'Late Night Journeys',
    viewport: { longitude: -73.94, latitude: 40.68, zoom: 12.5, bearing:0, pitch: 0 }
  },
  {
    title: 'Subway Melodies',
    viewport: { longitude: -73.99, latitude: 40.73, zoom: 11.5, bearing: 0, pitch: 0 }
  }
];

const StoriesView = React.memo(({ setViewport }) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);

  const handleStepEnter = useCallback((response) => {
    const { index } = response;
    setViewport(stories[index].viewport);
  }, [setViewport]);

  useEffect(() => {
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: '.stories-box',
        offset: 0.5,
      })
      .onStepEnter(handleStepEnter);

    return () => {
      if (scrollerRef.current) {
        scrollerRef.current.destroy();
      }
    };
  }, [handleStepEnter]);

  return (
    <div className="stories-view-container" ref={containerRef}>
      {stories.map((story, index) => (
        <div key={index} className="stories-box">
          <h2>{story.title}</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, 
            nunc id aliquam tincidunt, nunc nunc tincidunt urna, id tincidunt nunc 
            nunc id aliquam. Sed euismod, nunc id aliquam tincidunt, nunc nunc 
            tincidunt urna, id tincidunt nunc nunc id aliquam.
          </p>
        </div>
      ))}
    </div>
  );
});

export default StoriesView;