import {CompositeLayer} from '@deck.gl/core';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';
import { useMemo } from 'react';
import { usePrevious } from '../hooks/usePrevious';

const CIRCLE_SPACING = 0.00005;
const MAX_CIRCLES = 20;
export const BAR_RADIUS = 25;

/**
 * This is the new version of the MapBarLayer, which creates "bars" rising out of the map
 * using a line layer. It still uses small circles at the top and bottom of the bar to make it
 * look rounded. The hope is that this will use less memory since it replaces many points with one line.
 */
class FewerObjectsMapBarLayer extends CompositeLayer {
  renderLayers() {
    const {data, getBasePosition, getHeight, getWidth, getColor, pickable, onHover, upVector} = this.props;

    const topPointLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'top-point',
      data: data.filter(d => getHeight(d) > CIRCLE_SPACING * MAX_CIRCLES),
      getPosition: d => {
        const base = getBasePosition(d);
        const height = getHeight(d);
        return getRotatedPosition(base, height, upVector);
      },
      getRadius: d => getWidth(d),
      pickable,
      onHover,
      getFillColor: getColor,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight, upVector],
        getRadius: [getWidth],
        getFillColor: this.props.updateTriggers.getColor,
      }
    }))

    const lineLayer = new LineLayer(this.getSubLayerProps({
      id: 'bar',
      data: data.filter(d => getHeight(d) > CIRCLE_SPACING * MAX_CIRCLES),
      getSourcePosition: d => {
        const base = getBasePosition(d);
        return getRotatedPosition(base, CIRCLE_SPACING * (MAX_CIRCLES - 1), upVector);
      },
      getTargetPosition: d => {
        const base = getBasePosition(d);
        const height = getHeight(d);
        return getRotatedPosition(base, height, upVector);
      },
      pickable,
      onHover,
      getFillColor: getColor,
      getColor: getColor,
      getWidth,
      widthUnits: 'meters',
      updateTriggers: {
        getSourcePosition: [getBasePosition, upVector],
        getTargetPosition: [getBasePosition, getHeight, upVector],
        getFillColor: [this.props.updateTriggers.getColor],
        getColor: [this.props.updateTriggers.getColor],
        getWidth: [getWidth]
      }
    }))

    const bottomCirclesLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'bottom-circles',
      data: data.flatMap(d => this.generateBottomCircles(d, upVector)),
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: d => getWidth(d) * 0.5,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight, upVector],
        getRadius: [getWidth],
        getFillColor: [this.props.updateTriggers.getColor],
      }
    }))

    return [
      bottomCirclesLayer,
      topPointLayer,
      lineLayer,
    ];
  }

  generateBottomCircles(d, upVector) {
    const base = this.props.getBasePosition(d);
    const height = this.props.getHeight(d);
    const circles = [];
    const numCircles = Math.min(MAX_CIRCLES, Math.floor(height / CIRCLE_SPACING));
    for (let i = 0; i < numCircles; i++) {
      const opacity = (i / numCircles) * 0.9 * 255;
      const color = [...this.props.getColor(d)];
      color[3] = opacity;
      circles.push({
        ...d,
        position: getRotatedPosition(base, i * CIRCLE_SPACING, upVector),
        color: color,
      });
    }
    return circles;
  }
}

FewerObjectsMapBarLayer.layerName = 'MapBarLayer';
FewerObjectsMapBarLayer.defaultProps = {
  getBasePosition: {type: 'accessor', value: d => [d.lon, d.lat]},
  getHeight: {type: 'accessor', value: d => d.height || 100},
  getWidth: {type: 'accessor', value: _d => BAR_RADIUS},
  getColor: {type: 'accessor', value: [255, 0, 0]}
};

/**
 * This is the original version of the MapBarLayer, which creates "bars" rising out of the map
 * using a series of small circles stacked vertically.
 */
class CirclesOnlyMapBarLayer extends CompositeLayer {
  renderLayers() {
    const {data, getBasePosition, getHeight, getWidth, pickable, onHover, upVector} = this.props;

    const circlesLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'circles',
      data: data.flatMap(d => this.generatePoints(d, upVector)),
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: d => getWidth(d),
      pickable,
      onHover,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight, upVector],
        getRadius: [getWidth],
        getFillColor: [this.props.updateTriggers.getColor, getHeight],
      }
    }));

    return [circlesLayer];
  }

  generatePoints(d, upVector) {
    const base = this.props.getBasePosition(d);
    const height = Math.floor(this.props.getHeight(d) / CIRCLE_SPACING);
    const color = this.props.getColor(d);
    const points = [];

    const MAX_CIRCLES_WITH_OPACITY = Math.min(height, 200);
    const MAX_OPACITY = 0.9;
    
    for (let i = 0; i < height; i++) {
      const opacity = i < MAX_CIRCLES_WITH_OPACITY ? (i / MAX_CIRCLES_WITH_OPACITY) * MAX_OPACITY : MAX_OPACITY;
      const colorWithOpacity = [...color];
      colorWithOpacity[3] = opacity * 255;
      points.push({
        ...d,
        position: getRotatedPosition(base, CIRCLE_SPACING * i, upVector),
        color: colorWithOpacity,
      });
    }

    return points;
  }
}

CirclesOnlyMapBarLayer.layerName = 'CirclesOnlyMapBarLayer';
CirclesOnlyMapBarLayer.defaultProps = {
  getBasePosition: {type: 'accessor', value: d => [d.lon, d.lat]},
  getHeight: {type: 'accessor', value: d => d.height || 100},
  getWidth: {type: 'accessor', value: _d => BAR_RADIUS},
  getColor: {type: 'accessor', value: [255, 0, 0]}
};

/** Will use CirclesOnlyMapBar layer when possible, but will switch to FewerObjectsMapBarLayer if we would need to render too many circles. */
class MemoryAdaptiveMapBarLayer extends CompositeLayer {
  renderLayers() {
    const {data, getBasePosition, getHeight, getWidth, pickable, getColor, onHover, upVector} = this.props;
    const MAX_TOTAL_CIRCLES = 100000;

    // Calculate total number of circles that would be needed
    const totalCircles = data.reduce((sum, d) => {
      const height = getHeight(d);
      return sum + Math.floor(height / CIRCLE_SPACING);
    }, 0);

    // Choose the appropriate layer based on the total number of circles
    const ChosenLayer = totalCircles > MAX_TOTAL_CIRCLES
      ? FewerObjectsMapBarLayer
      : CirclesOnlyMapBarLayer;

    const chosenLayer = new ChosenLayer({ 
      id: 'adaptive-bar-layer',
      data,
      getBasePosition,
      getHeight,
      getWidth,
      getColor,
      pickable,
      onHover,
      upVector,
      updateTriggers: this.props.updateTriggers
    });

    return [chosenLayer];
  }
}

MemoryAdaptiveMapBarLayer.layerName = 'MemoryAdaptiveMapBarLayer';
MemoryAdaptiveMapBarLayer.defaultProps = {
  ...CirclesOnlyMapBarLayer.defaultProps,
  // Add any additional default props
};

const MapBarLayer = MemoryAdaptiveMapBarLayer;

const getRotatedPosition = (base, height, upVector) => {
  return [
    base[0] + upVector[0] * height,
    base[1] + upVector[1] * height
  ];
};

// Get the unit map-space vector that points "up" in screen space
const ORIGIN_CENTRAL_PARK = [-73.9682, 40.7826]
export const useUpVector = (map, viewport) => {
  return useMemo(() => {
    const bearing = viewport?.bearing ?? 0
    if (!map || bearing === 0 ) {
      // If no map is provided or bearing is 0, just move "up" in latitude
      return [0, 1];
    }

    // Project base point to screen coordinates
    const baseScreen = map.project(ORIGIN_CENTRAL_PARK);
    
    // Project a point directly "up" in screen space (subtract from y since screen coords are inverted)
    const upScreen = [baseScreen.x, baseScreen.y - 100];
    
    // Unproject back to map coordinates to see which direction is "up" in the current view
    const upMap = map.unproject(upScreen);

    // Calculate the vector that represents "up" in map coordinates
    const upVector = [
      upMap.lng - ORIGIN_CENTRAL_PARK[0],
      upMap.lat - ORIGIN_CENTRAL_PARK[1]
    ];
    
    // Normalize the vector
    const length = Math.sqrt(upVector[0] * upVector[0] + upVector[1] * upVector[1]);
    const normalizedUp = [
      (upVector[0] / length),
      (upVector[1] / length)
    ];

    return normalizedUp
  }, [map, viewport.bearing])
}

export default MapBarLayer;
