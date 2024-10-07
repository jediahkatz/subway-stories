import React, { useEffect, useRef } from 'react';
import scrollama from 'scrollama';
import './StoriesView.css';

const StoriesView = () => {
  const containerRef = useRef(null);
  const storyRefs = useRef([]);

  useEffect(() => {
    const scroller = scrollama();

    scroller
      .setup({
        step: '.stories-box',
        offset: 0.5,
        progress: true,
      })
      .onStepEnter((response) => {
        console.log(`Entered step ${response.index}`);
      })
      .onStepExit((response) => {
        console.log(`Exited step ${response.index}`);
      });

    return () => scroller.destroy();
  }, []);

  return (
    <div className="stories-view-container" ref={containerRef}>
      {['Subway Stories', 'Rush Hour Tales', 'Underground Encounters', 'Late Night Journeys', 'Subway Melodies'].map((title, index) => (
        <div 
          key={index} 
          className="stories-box" 
          ref={el => storyRefs.current[index] = el}
        >
          <h2>{title}</h2>
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
};

export default StoriesView;