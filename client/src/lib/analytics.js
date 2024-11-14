// Track events with GA4
export const trackEvent = (eventName, eventParams = {}) => {
    // Log locally for development
    if (process.env.ENVIRONMENT === 'development') {
        console.log('🔍 Analytics Event:', eventName, eventParams);
    }
    
    if (window.gtag) {
        const prefix = process.env.ENVIRONMENT === 'development' ? 'dev-' : '';
        window.gtag('event', prefix + eventName, eventParams);
    }
};