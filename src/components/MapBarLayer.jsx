import {CompositeLayer} from '@deck.gl/core';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';

const CIRCLE_SPACING = 0.00005;
const MAX_CIRCLES = 20;

/**
 * This is the new version of the MapBarLayer, which creates "bars" rising out of the map
 * using a line layer. It still uses small circles at the top and bottom of the bar to make it
 * look rounded. The hope is that this will use less memory since it replaces many points with one line.
 */
class MapBarLayer extends CompositeLayer {
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
      getRadius: d => getWidth(d) * 0.5,
      pickable,
      onHover,
      getFillColor: getColor,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight],
        getColor: this.props.updateTriggers.getColor,
        getRadius: [getWidth]
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
      getColor,
      getWidth,
      widthUnits: 'meters',
      updateTriggers: {
        getSourcePosition: [getBasePosition],
        getTargetPosition: [getBasePosition, getHeight],
        getColor: this.props.updateTriggers.getColor,
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
        getColor: this.props.updateTriggers.getColor,
        getRadius: [getWidth]
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

MapBarLayer.layerName = 'MapBarLayer';
MapBarLayer.defaultProps = {
  getBasePosition: {type: 'accessor', value: d => [d.lon, d.lat]},
  getHeight: {type: 'accessor', value: d => d.height || 100},
  getWidth: {type: 'accessor', value: _d => 30},
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
      getColor: d => d.color,
      getRadius: d => getWidth(d) * 0.5,
      pickable,
      onHover,
      updateTriggers: {
        getPosition: [getBasePosition, getHeight],
        getColor: [this.props.updateTriggers.getColor, getHeight],
        getRadius: [getWidth]
      }
    }));

    return [circlesLayer];
  }

  generatePoints(d) {
    const base = this.props.getBasePosition(d);
    const height = Math.floor(this.props.getHeight(d) / 0.00005); // Convert height to number of points
    const color = this.props.getColor(d);
    const points = [];

    for (let i = 0; i < height; i++) {
      const opacity = (i / height) * 0.9; // Opacity increases from 0 to 0.9
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
  getWidth: {type: 'accessor', value: _d => 30},
  getColor: {type: 'accessor', value: [255, 0, 0]}
};

export default MapBarLayer;