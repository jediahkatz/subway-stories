import React, { useState } from 'react';
import MTADataMap from './components/MTADataMap';
import PasswordPage from './components/Password';
import './App.css';
import { getEnvVar } from './lib/env';

const mapboxToken = getEnvVar('VITE_MAPBOX_TOKEN');

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
