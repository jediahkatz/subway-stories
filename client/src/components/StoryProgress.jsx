import React, { useState, useRef } from 'react';
import './StoriesView.css';

const StoryProgress = ({ stories, currentStoryIndex, currentPartIndex, handleJumpToStory, handleJumpToPart, setPreviewStory }) => {
    const [activePreview, setActivePreview] = useState(null);
    const timeoutRef = useRef(null);

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

    return (
        <div className="story-progress">
            {stories.map((story, storyIndex) => (
                <div key={storyIndex} className="story-line-container">
                    <div className="story-line-wrapper">
                        <div 
                            className={`story-line ${storyIndex === currentStoryIndex && currentPartIndex === 0 ? 'active' : ''}`}
                        />
                        <div 
                            className="story-line-hitbox"
                            onClick={() => handleClickStory(storyIndex)}
                            onMouseEnter={() => handleMouseEnter(storyIndex)}
                            onMouseLeave={handleMouseLeave}
                        />
                    </div>
                    {storyIndex === currentStoryIndex && (
                        <div className="part-lines">
                            {story.parts.slice(1).map((_, partIndex) => (
                                <div key={partIndex} className="part-line-wrapper">
                                    <div 
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
            ))}
        </div>
    );
};

export default StoryProgress;
