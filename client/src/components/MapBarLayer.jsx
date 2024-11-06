import {CompositeLayer} from '@deck.gl/core';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';

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
    const {data, getBasePosition, getHeight, getWidth, getColor, pickable, onHover} = this.props;

    const topPointLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'top-point',
      data: data.filter(d => getHeight(d) > CIRCLE_SPACING * MAX_CIRCLES),
      getPosition: d => {
        const base = getBasePosition(d);
        const height = getHeight(d);
        return [base[0], base[1] + height];
      },
      getRadius: d => getWidth(d),
      pickable,
      onHover,
      getFillColor: getColor,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight],
        getRadius: [getWidth],
        getFillColor: this.props.updateTriggers.getColor,
      }
    }))

    const lineLayer = new LineLayer(this.getSubLayerProps({
      id: 'bar',
      data: data.filter(d => getHeight(d) > CIRCLE_SPACING * MAX_CIRCLES),
      getSourcePosition: d => { 
        const base = getBasePosition(d)
        return [base[0], base[1] + CIRCLE_SPACING * (MAX_CIRCLES - 1)]
      },
      getTargetPosition: d => {
        const base = getBasePosition(d);
        const height = getHeight(d);
        return [base[0], base[1] + height];
      },
      pickable,
      onHover,
      getFillColor: getColor,
      getColor: getColor,
      getWidth,
      widthUnits: 'meters',
      updateTriggers: {
        getSourcePosition: [getBasePosition],
        getTargetPosition: [getBasePosition, getHeight],
        getFillColor: [this.props.updateTriggers.getColor],
        getColor: [this.props.updateTriggers.getColor],
        getWidth: [getWidth]
      }
    }))

    const bottomCirclesLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'bottom-circles',
      data: data.flatMap(d => this.generateBottomCircles(d)),
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: d => getWidth(d) * 0.5,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight],
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

  generateBottomCircles(d) {
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
        position: [base[0], base[1] + i * 0.00005],
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
    const {data, getBasePosition, getHeight, getWidth, pickable, onHover} = this.props;

    const circlesLayer = new ScatterplotLayer(this.getSubLayerProps({
      id: 'circles',
      data: data.flatMap(d => this.generatePoints(d)),
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: d => getWidth(d),
      pickable,
      onHover,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight],
        getRadius: [getWidth],
        getFillColor: [this.props.updateTriggers.getColor, getHeight],
      }
    }));

    return [circlesLayer];
  }

  generatePoints(d) {
    const base = this.props.getBasePosition(d);
    const height = Math.floor(this.props.getHeight(d) / 0.00005); // Convert height to number of points
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
        position: [base[0], base[1] + 0.00005 * i],
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
    const {data, getBasePosition, getHeight, getWidth, pickable, getColor, onHover} = this.props;
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

export default MapBarLayer;
