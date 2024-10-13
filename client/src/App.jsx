import React, { useState, useEffect } from 'react';
import MTADataMap from './components/MTADataMap';
import PasswordPage from './components/Password';
import './App.css';
import { getEnvVar } from './lib/env';

const MAPBOX_TOKEN = getEnvVar('VITE_MAPBOX_TOKEN');
const SERVER_BASE_URL = getEnvVar('VITE_SQL_SERVER_URL');
const SHOULD_LOAD_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const App = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  useEffect(() => {
    const checkShouldLoad = async () => {
      const now = Date.now();

      if (now - lastCheckTime > SHOULD_LOAD_CHECK_INTERVAL) {
        try {
          const response = await fetch(`${SERVER_BASE_URL}/mapbox-load`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const shouldLoad = data.shouldLoad;
          setShouldLoad(shouldLoad);
          setLastCheckTime(now);
        } catch (error) {
          console.error('Error checking mapbox load:', error);
          console.error('Error details:', error.message);
        }
      }
    };

    checkShouldLoad();
  }, [lastCheckTime]);

  return (
    <div className="App">
      <PasswordPage onCorrectPassword={() => {}}>
        <MTADataMap mapboxToken={MAPBOX_TOKEN} controller={true} />
      </PasswordPage>
    </div>
  );
};

export default App;
