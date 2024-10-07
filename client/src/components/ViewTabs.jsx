import React from 'react';
import './ViewTabs.css';

const ViewTabs = ({ activeView, setActiveView }) => {
  return (
    <div className="view-tabs">
      <button
        className={`tab ${activeView === 'visualization' ? 'active' : ''}`}
        onClick={() => setActiveView('visualization')}
      >
        Visualization
      </button>
      <button
        className={`tab ${activeView === 'stories' ? 'active' : ''}`}
        onClick={() => setActiveView('stories')}
      >
        Stories
      </button>
    </div>
  );
};

export default ViewTabs;