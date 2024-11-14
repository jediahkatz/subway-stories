import React from 'react';
import './ViewTabs.css';
import { trackEvent } from '../lib/analytics';

const ViewTabs = ({ activeView, setActiveView, limitVisibleLines, setSelectedBarScale }) => {
  return (
    <div className="view-tabs">
      <div className={`tab-selector ${activeView}`}>
        <button
          className={`tab-button visualization ${activeView === 'visualization' ? 'active' : ''}`}
          onClick={() => { 
            trackEvent('explore_clicked');
            setActiveView('visualization')
            limitVisibleLines(null)
            setSelectedBarScale(null)
          }}
        >
          Explore
        </button>
        <button
          className={`tab-button stories ${activeView === 'stories' ? 'active' : ''}`}
          onClick={() => {
            trackEvent('stories_clicked');
            setActiveView('stories')
          }}
        >
          Stories
        </button>
      </div>
    </div>
  );
};

export default ViewTabs;
