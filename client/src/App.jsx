import React, { useState, useEffect } from 'react';
import MTADataMap from './components/MTADataMap';
import PasswordPage from './components/Password';
import './App.css';
import { getEnvVar } from './lib/env';
import { trackEvent } from './lib/analytics';

const MAPBOX_TOKEN = getEnvVar('VITE_MAPBOX_TOKEN');
const SERVER_BASE_URL = getEnvVar('VITE_SQL_SERVER_URL');
const SHOULD_LOAD_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const App = () => {
  const [shouldLoadMapbox, setShouldLoadMapbox] = useState(false);
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
          setShouldLoadMapbox(shouldLoad);
          setLastCheckTime(now);
        } catch (error) {
          const thisURL = window.location.href;
          if (thisURL.includes('netlify.app')) {
            alert("This URL is deprecated. Please visit subway-stories.nyc")
          } else {
            console.error('Error checking mapbox load:', error);
            console.error('Error details:', error.message);
          }
        }
      }
    };

    checkShouldLoad();
  }, [lastCheckTime]);

  const isMobileDevice = React.useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile;
  }, []);

  const isScreenTooSmall = React.useMemo(() => {
    return window.innerWidth < 1000;
  }, []);

  if (isMobileDevice) {
    trackEvent('mobile_not_supported');
    return (
      <div className="mobile-not-supported">
        <div className="metrocard-background"></div>
        <h2>Please carry MetroCard at all times</h2>
        <h3>Support for mobile devices is coming soon</h3>
      </div>
    );
  }

  if (isScreenTooSmall) {
    trackEvent('screen_too_small');
    return (
      <div className="mobile-not-supported">
        <div className="metrocard-background"></div>
        <h2>Please reload on a full-sized window.</h2>
        <h3>Support for smaller screens is coming soon</h3>
      </div>
    );
  }

  return (
    <div className="App">
      {shouldLoadMapbox && <MTADataMap mapboxToken={MAPBOX_TOKEN} controller={true} />}
    </div>
  );
};

export default App;
