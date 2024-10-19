import React, { useEffect, useRef, useCallback, useState } from 'react';
import scrollama from 'scrollama';
import './StoriesView.css';
import { FlyToInterpolator } from 'deck.gl';
import { areViewportsNearlyEqual, getViewportForBounds } from '../lib/map-bounds';
import { stationIdToStation } from '../lib/stations';
import { MAIN_STATION_COLOR } from './MTADataMap';
import StoryProgress from './StoryProgress';

export const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const stories = [
  {
    title: 'A Tale of Five Chinatowns',
    parts: [
      {
        description: <>
          “They go in the morning for Dim Sum,” explains Anna Li, 26(?), when I ask her why hundreds of people flock from her neighborhood, Bensonhurst, to Manhattan's Chinatown at 8 a.m. every Saturday. Bensonhurst and Sunset Park, where Anna grew up, house the two largest Chinese communities in Brooklyn. Although younger generations of Chinese are choosing more and more to settle away from the din of Manhattan, the original Chinatown is still a crucial gathering-place for the community.
        </>,
        viewport: { longitude: -73.990, latitude: 40.651, zoom: 11.35, bearing: 0, pitch: 0 },
        // Grand St (B D), Coney Island-Stillwell Av (D F N Q), and Bay Ridge-95 St (R)
        pointsToInclude: [stationIdToStation['231'], stationIdToStation['58'], stationIdToStation['39']], 
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
        // viewport: { longitude: -73.990, latitude: 40.651, zoom: 11.35, bearing: 0, pitch: 0 },
        pointsToInclude: [stationIdToStation['231'], stationIdToStation['58'], stationIdToStation['39']],
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
        // viewport: { longitude: -73.90, latitude: 40.754, zoom: 11.68, bearing: 0, pitch: 0 },
        // Grand St (B D) and Flushing-Main St (7)
        pointsToInclude: [stationIdToStation['231'], stationIdToStation['447']],
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
        // viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
        // Flushing-Main St (7) and Vernon Blvd-Jackson Av (7)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['464']],
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
          On the weekend, straphangers pour back into Flushing for another reason: the food. [name some restaurants or cuisines]. Restaurant workers are out the door first at 7 and 8 a.m. For dinner, the Corona crowd is joined by a new set of younger, affluent Chinese from Long Island City. Its population has swelled with tech workers, who seek modern amenities and proximity to both Flushing and Midtown.
        </>,
        // viewport: { longitude: -73.882, latitude: 40.745, zoom: 12, bearing: 0, pitch: 0 },
        // Flushing-Main St (7) and Vernon Blvd-Jackson Av (7)
        pointsToInclude: [stationIdToStation['447'], stationIdToStation['464']],
        dataview: {
          station: '447', // Flushing-Main St (7)
          direction: 'comingFrom',
          day: 'Saturday',
          hour: 17,
          months: ALL_MONTHS,
          visibleLines: ['7']
        },
      }
    ]
  },
  {
    title: 'Lorem Ipsum Adventure',
    parts: [
      {
        description: <>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </>,
        viewport: { longitude: -73.98, latitude: 40.75, zoom: 12, bearing: 0, pitch: 0 },
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']], // Times Sq-42 St (1 2 3) and 34 St-Penn Station (1 2 3)
        dataview: {
          station: '611', // Times Sq-42 St (1 2 3)
          direction: 'goingTo',
          day: 'Monday',
          hour: 9,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
      {
        description: <>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </>,
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']],
        dataview: {
          station: '127', // 34 St-Penn Station (1 2 3)
          direction: 'comingFrom',
          day: 'Friday',
          hour: 18,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
    ]
  },
  {
    title: 'Lorem Ipsum Adventure 2 E.B.',
    parts: [
      {
        description: <>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </>,
        viewport: { longitude: -73.98, latitude: 40.75, zoom: 12, bearing: 0, pitch: 0 },
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']], // Times Sq-42 St (1 2 3) and 34 St-Penn Station (1 2 3)
        dataview: {
          station: '611', // Times Sq-42 St (1 2 3)
          direction: 'goingTo',
          day: 'Monday',
          hour: 9,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
      {
        description: <>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </>,
        pointsToInclude: [stationIdToStation['611'], stationIdToStation['318']],
        dataview: {
          station: '127', // 34 St-Penn Station (1 2 3)
          direction: 'comingFrom',
          day: 'Friday',
          hour: 18,
          months: ALL_MONTHS,
          visibleLines: ['1', '2', '3'],
        },
      },
    ]
  }
];

// todo: make this dynamic based on the width of the screen
const STORY_BOX_WIDTH = 400 + 20 + 20;
const STORY_BOX_LEFT_OFFSET = 20;
const FLOATING_INFO_BAR_HEIGHT = 54;
const FLOATING_INFO_BAR_OFFSET = 20;

const StoriesView = React.memo(({
  handleDataSettingsChange,
  setViewport, 
  limitVisibleLines,
  selectedStation,
  selectedDirection,
  selectedDay,
  selectedHour,
  selectedMonths,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(scrollama());
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const getPadding = () => {
    return {
      top: window.innerHeight * 0.05,
      bottom: window.innerHeight * 0.05 + FLOATING_INFO_BAR_HEIGHT + FLOATING_INFO_BAR_OFFSET,
      left: window.innerWidth * 0.05 + STORY_BOX_WIDTH + STORY_BOX_LEFT_OFFSET,
      right: window.innerWidth * 0.05,
    };
  }
  
  const handleStepEnter = useCallback((response) => {
    const { index } = response;
    let storyIndex = 0;
    let partIndex = index;

    // Calculate the current story and part index
    for (let i = 0; i < stories.length; i++) {
      if (partIndex < stories[i].parts.length) {
        storyIndex = i;
        break;
      }
      partIndex -= stories[i].parts.length;
    }

    setCurrentStoryIndex(storyIndex);
    setCurrentPartIndex(partIndex);

    const currentStory = stories[storyIndex];
    const currentPart = currentStory.parts[partIndex];

    setViewport(viewport => {
      const newViewport = getViewportForBounds({
        pointsToInclude: currentPart.pointsToInclude,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        padding: getPadding(),
      });

      const transition = areViewportsNearlyEqual(viewport, newViewport) ? {} : {
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      };
      return {
        ...newViewport,
        ...transition,
      };
    });
    handleDataSettingsChange({
      newSelectedStation: currentPart.dataview.station,
      newSelectedDirection: currentPart.dataview.direction,
      newSelectedDay: currentPart.dataview.day,
      newSelectedHour: currentPart.dataview.hour,
      newSelectedMonths: currentPart.dataview.months,
    });
    limitVisibleLines(currentPart.dataview.visibleLines);
  }, [setViewport, handleDataSettingsChange, limitVisibleLines]);

  const handleJumpToStory = useCallback((storyIndex, partIndex) => {
    const storyBoxes = containerRef.current.querySelectorAll('.stories-box');
    let targetIndex = 0;
    
    // Calculate the target index based on story and part index
    for (let i = 0; i < storyIndex; i++) {
      targetIndex += stories[i].parts.length;
    }
    targetIndex += partIndex;

    if (storyBoxes[targetIndex]) {
      const targetElement = storyBoxes[targetIndex];
      const containerHeight = containerRef.current.clientHeight;
      const targetRect = targetElement.getBoundingClientRect();
      const targetTop = targetElement.offsetTop;
      const targetHeight = targetRect.height;

      // Calculate the scroll position to center the target element
      const scrollPosition = targetTop - (containerHeight / 2) + (targetHeight / 2);

      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [stories]);

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
      {/* {stories[0].parts.map((part, index) => (
        <div key={index} className="stories-box">
          {index === 0 && <h2>{stories[0].title}</h2>}
          <p>{part.description}</p>
        </div>
      ))} */}
      {stories.map((story, storyIndex) => (
        <React.Fragment key={storyIndex}>
          {story.parts.map((part, partIndex) => (
            <div key={`${storyIndex}-${partIndex}`} className="stories-box">
              {partIndex === 0 && <h2>{story.title}</h2>}
              <p>{part.description}</p>
            </div>
          ))}
        </React.Fragment>
      ))}
      <div className="floating-info-bar">
        {formatInfoBarText(selectedDirection, selectedStation, selectedHour, selectedDay, selectedMonths)}
      </div>
      <StoryProgress
        stories={stories}
        currentStoryIndex={currentStoryIndex}
        currentPartIndex={currentPartIndex}
        handleJumpToStory={handleJumpToStory}
      />
    </div>
  );
});

const formatInfoBarText = (direction, stationId, hour, day, selectedMonths) => {
  const stationName = stationIdToStation[stationId]?.display_name.split('(')[0].trim() || 'here';
  const formattedHour = hour % 12 || 12;
  const amPm = hour < 12 ? 'a.m.' : 'p.m.';
  const directionText = direction === 'comingFrom' ? 'going to' : 'coming from';

  let monthText = '';
  if (selectedMonths.length < 12) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    if (selectedMonths.length === 1) {
      monthText = ` in ${monthNames[selectedMonths[0]]}`;
    } else {
      const firstMonth = monthNames[selectedMonths[0]];
      const lastMonth = monthNames[selectedMonths[selectedMonths.length - 1]];
      monthText = ` from ${firstMonth} – ${lastMonth}`;
    }
  }

  return (
    <>
      Who's {directionText} <span className="highlight-station" style={{color: `rgb(${MAIN_STATION_COLOR.join(',')})`}}>{stationName}</span> at <span className="highlight-time">{formattedHour} {amPm} on a {day}{monthText}</span>?
    </>
  );
};

export default StoriesView;
