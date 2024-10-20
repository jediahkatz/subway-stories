import React from 'react';
import './StoriesView.css';

const StoryProgress = ({ stories, currentStoryIndex, currentPartIndex, handleJumpToStory, handleJumpToPart, setPreviewStory }) => {
    const handleClickStory = (storyIndex) => {
        handleJumpToStory(storyIndex, 0);
        setPreviewStory(null);
    }

    const handleClickPart = (storyIndex, partIndex) => {
        handleJumpToPart(storyIndex, partIndex);
        setPreviewStory(null);
    }

    return (
    <div className="story-progress">
      {stories.map((story, storyIndex) => (
        <div key={storyIndex} className="story-line-container">
          <div 
            className={`story-line ${storyIndex === currentStoryIndex ? 'active' : ''}`}
            onClick={() => handleClickStory(storyIndex)}
            onMouseEnter={() => storyIndex !== currentStoryIndex && setPreviewStory(storyIndex)}
            onMouseLeave={() => storyIndex !== currentStoryIndex && setPreviewStory(null)}
          />
          {storyIndex === currentStoryIndex && (
            <div className="part-lines">
              {story.parts.map((_, partIndex) => (
                <div 
                  key={partIndex}
                  className={`part-line ${partIndex === currentPartIndex ? 'active' : ''}`}
                  onClick={() => handleClickPart(storyIndex, partIndex)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StoryProgress;
