import { isDev } from "./env";

const alreadyTrackedEvents = new Set();

// Track events with GA4
export const trackEvent = (eventName, eventParams = {}, firstTimeOnly = false) => {
    // Log locally for development
    if (isDev) {
        console.log('🔍 Analytics Event:', eventName, eventParams);
    }

    if (!window.gtag) {
        return;
    }

    if (firstTimeOnly && alreadyTrackedEvents.has(eventName)) {
        return;
    }

    const prefix = isDev ? 'dev-' : '';
    window.gtag('event', prefix + eventName, eventParams);
    alreadyTrackedEvents.add(eventName);
};
