import React from 'react';
import './StoriesView.css';

const StoryProgress = ({ stories, currentStoryIndex, currentPartIndex, handleJumpToStory }) => {
  return (
    <div className="story-progress">
      {stories.map((story, storyIndex) => (
        <div key={storyIndex} className="story-line-container">
          <div 
            className={`story-line ${storyIndex === currentStoryIndex ? 'active' : ''}`}
            onClick={() => handleJumpToStory(storyIndex, 0)}
          />
          {storyIndex === currentStoryIndex && (
            <div className="part-lines">
              {story.parts.map((_, partIndex) => (
                <div 
                  key={partIndex}
                  className={`part-line ${partIndex === currentPartIndex ? 'active' : ''}`}
                  onClick={() => handleJumpToStory(storyIndex, partIndex)}
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
