import React, { useState, useRef, useEffect } from 'react';
import './StoriesView.css';

const StoryProgress = ({ stories, currentStoryIndex, currentPartIndex, handleJumpToStory, handleJumpToPart, setPreviewStory }) => {
    const [activePreview, setActivePreview] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Trigger expansion animation after a short delay
        const timer = setTimeout(() => {
            setIsExpanded(v => !v);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleClickStory = (storyIndex) => {
        handleJumpToStory(storyIndex, 0);
        setPreviewStory(null);
        setActivePreview(null);
    }

    const handleClickPart = (storyIndex, partIndex) => {
        handleJumpToPart(storyIndex, partIndex);
        setPreviewStory(null);
        setActivePreview(null);
    }

    const handleMouseEnter = (storyIndex) => {
        if (storyIndex !== currentStoryIndex) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setPreviewStory(storyIndex);
            setActivePreview(storyIndex);
        }
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (activePreview !== null) {
                setPreviewStory(null);
                setActivePreview(null);
            }
        }, 500);
    }

    const visibleStories = stories.slice(1)

    return (
        <div className="story-progress">
            {visibleStories.flatMap((story, storyIndex) => {
                // account for intro card
                storyIndex += 1

                return (
                  <div key={storyIndex} className="story-line-container">
                      <div className="story-line-wrapper" 
                          onClick={() => handleClickStory(storyIndex)}
                          onMouseEnter={() => handleMouseEnter(storyIndex)}
                          onMouseLeave={handleMouseLeave}
                      >
                          <div 
                              className={`story-line ${storyIndex === currentStoryIndex && currentPartIndex === 0 ? 'active' : ''}`}
                          />
                          <div 
                              className="story-line-hitbox"
                          />
                      </div>
                      {storyIndex === currentStoryIndex && (
                          <div className={`part-lines ${!isExpanded ? 'hidden' : ''}`} style={isExpanded ? { height: `${(story.parts.length - 1) * 16 - 12}px` } : {}}>
                              {story.parts.slice(1).map((_, partIndex) => (
                                  <div key={partIndex} className={`part-line-wrapper ${!isExpanded ? 'hidden' : ''}`}>
                                      <div 
                                          onClick={() => handleClickPart(storyIndex, partIndex + 1)}
                                          className={`part-line ${partIndex + 1 === currentPartIndex ? 'active' : ''}`}
                                      />
                                      <div 
                                          className="part-line-hitbox"
                                          onClick={() => handleClickPart(storyIndex, partIndex + 1)}
                                      />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                )
              })}
        </div>
    );
};

export default StoryProgress;
