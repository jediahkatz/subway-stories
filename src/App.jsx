import React from 'react';
import MTADataMap from './components/MTADataMap';
import './App.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const App = () => {
  return (
    <div className="App">
      <MTADataMap mapboxToken={mapboxToken} controller={true} />
    </div>
  );
};

export default App;
