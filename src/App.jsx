import React, { useState } from 'react';
import MTADataMap from './components/MTADataMap';
import PasswordPage from './components/Password';
import './App.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? process.env.VITE_MAPBOX_TOKEN;

const App = () => {
  return (
    <div className="App">
      <PasswordPage onCorrectPassword={() => {}}>
        <MTADataMap mapboxToken={mapboxToken} controller={true} />
      </PasswordPage>
    </div>
  );
};

export default App;
