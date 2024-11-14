const alreadyTrackedEvents = new Set();

// Track events with GA4
export const trackEvent = (eventName, eventParams = {}, firstTimeOnly = false) => {
    // Log locally for development
    if (process.env.ENVIRONMENT === 'development') {
        console.log('🔍 Analytics Event:', eventName, eventParams);
    }

    if (!window.gtag) {
        return;
    }

    if (firstTimeOnly && alreadyTrackedEvents.has(eventName)) {
        return;
    }

    const prefix = process.env.ENVIRONMENT === 'development' ? 'dev-' : '';
    window.gtag('event', prefix + eventName, eventParams);
    alreadyTrackedEvents.add(eventName);
};
