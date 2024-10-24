import React from 'react';
import './ViewTabs.css';

const ViewTabs = ({ activeView, setActiveView, limitVisibleLines, setSelectedBarScale }) => {
  return (
    <div className="view-tabs">
      <div className={`tab-selector ${activeView}`}>
        <button
          className={`tab-button visualization ${activeView === 'visualization' ? 'active' : ''}`}
          onClick={() => { 
            setActiveView('visualization')
            limitVisibleLines(null)
            // setSelectedBarScale(null)
          }}
        >
          Visualization
        </button>
        <button
          className={`tab-button stories ${activeView === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveView('stories')}
        >
          Stories
        </button>
      </div>
    </div>
  );
};

export default ViewTabs;
