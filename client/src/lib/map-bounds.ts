export const getViewportForBounds = (
    { pointsToInclude, padding, viewportWidth, viewportHeight }: 
    { 
        pointsToInclude: { lat: number, lon: number }[],
        padding: { top: number, bottom: number, left: number, right: number },
        viewportWidth: number,
        viewportHeight: number
    }
) => {
    const paddingLeft = padding?.left || 0;
    const paddingRight = padding?.right || 0;
    const paddingTop = padding?.top || 0;
    const paddingBottom = padding?.bottom || 0; 

    const mapWidth = viewportWidth - paddingLeft - paddingRight;
    const mapHeight = viewportHeight - paddingTop - paddingBottom;

    const { minLon, maxLon, minLat, maxLat } = getBoundsFromPoints(pointsToInclude);
    const longitudeDelta = maxLon - minLon;
    const latitudeDelta = maxLat - minLat;

    // Calculate the center, accounting for padding
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const paddingLeftInDegrees = (paddingLeft / mapWidth) * longitudeDelta;
    const paddingRightInDegrees = (paddingRight / mapWidth) * longitudeDelta;
    const paddingTopInDegrees = (paddingTop / mapHeight) * latitudeDelta;
    const paddingBottomInDegrees = (paddingBottom / mapHeight) * latitudeDelta;

    const centerLonWithPadding = centerLon - (paddingLeftInDegrees - paddingRightInDegrees) / 2;
    const centerLatWithPadding = centerLat - (paddingBottomInDegrees - paddingTopInDegrees) / 2;

    // Calculate zoom for width (longitude)
    const zoomX = Math.log2(mapWidth / (longitudeDelta * (WORLD_DIM.width / 360)));
    
    // Calculate zoom for height (latitude)
    const latitudeAdjustment = Math.cos(centerLatWithPadding * (Math.PI / 180));  // Convert to radians
    const zoomY = Math.log2(mapHeight / (latitudeDelta * (WORLD_DIM.height / 360) / latitudeAdjustment));

    // Return the smaller of the two zoom levels
    const zoom = Math.min(zoomX, zoomY);

    const roundTo3Decimals = (n: number) => Math.round(n * 1000) / 1000;

    return { latitude: roundTo3Decimals(centerLatWithPadding), longitude: roundTo3Decimals(centerLonWithPadding), zoom: roundTo3Decimals(zoom) };
}

// 512x512 tiles for Mapbox GL
const WORLD_DIM = { width: 512, height: 512 };

const getBoundsFromPoints = (points: { lat: number, lon: number }[]) => {
    const minLon = Math.min(...points.map(p => p.lon));
    const maxLon = Math.max(...points.map(p => p.lon));
    const minLat = Math.min(...points.map(p => p.lat));
    const maxLat = Math.max(...points.map(p => p.lat));
    return { minLon, maxLon, minLat, maxLat };
}

export const areViewportsNearlyEqual = (v1: any, v2: any) => {
    const THRESHOLD = 0.000001;
    return Math.abs(v1.latitude - v2.latitude) < THRESHOLD && Math.abs(v1.longitude - v2.longitude) < THRESHOLD && Math.abs(v1.zoom - v2.zoom) < THRESHOLD;
}