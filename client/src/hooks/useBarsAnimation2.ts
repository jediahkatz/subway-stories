import { useCallback, useRef, useState } from 'react';
import { stationIdToStation, stations } from '../lib/stations';

type BarData = { 
    type: 'LOADING' | 'DATA',
    heights: { [key: string]: { currentHeight: number } }
}
type AnimationResultFunc = (progress: number) => BarData

type WaveRadialAnimation = {
    type: 'WAVE_RADIAL_IN' | 'WAVE_RADIAL_OUT'
    centerLocation: [number, number]
    otherStationLocations: { [key: string]: [number, number] }
}

type BarChangeAnimation = {
    type: 'ANIMATE_BAR_CHANGE'
    // maps station_id to absolute bar height
    initialBarHeights: {
        [key: string]: number
    }
    newBarHeights: {
        [key: string]: number
    }
}

type BarChangeNoAnimation = {
    type: 'NO_ANIMATE_BAR_CHANGE'
    newBarHeights: {
        [key: string]: number
    }
}

type Animation = WaveRadialAnimation | BarChangeAnimation | BarChangeNoAnimation

type AnimationState = {
    animation: Animation
    animationResultFunc: AnimationResultFunc
    getProgress: () => number
}

export const useBarsAnimation2 = () => {
    const currentAnimation = useRef<AnimationState | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [barData, setBarData] = useState<BarData>({ type: 'LOADING', heights: {} });
    // Only used for wave radial animations. Allows us to know when it completed once
    const resolveAnimationRef = useRef<(() => void) | null>(null);

    const animateFrame = useCallback((_timestamp: number) => {
        if (!currentAnimation.current) {
            return;
        }

        const progress = currentAnimation.current.getProgress();

        switch (currentAnimation.current.animation.type) {
            case 'WAVE_RADIAL_IN':
            case 'WAVE_RADIAL_OUT': {
                const newBarData = currentAnimation.current.animationResultFunc(progress % 1);
                setBarData(newBarData);

                if (progress >= 1) {
                    if (resolveAnimationRef.current) {
                        resolveAnimationRef.current();
                        resolveAnimationRef.current = null;
                    }
                }
                // The wave radial animation can go on forever!
                animationFrameRef.current = requestAnimationFrame(animateFrame);
                break;
            }
            default: {
                const newBarData = currentAnimation.current.animationResultFunc(progress);
                setBarData(newBarData);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animateFrame);
                } else {
                    cancelAnimation();
                }
                break;
            }
        }
    }, []);

    const startAnimation = useCallback((animation: Animation): Promise<void> => {
        cancelAnimation();

        return new Promise((resolve) => {
            switch (animation.type) {
                case 'WAVE_RADIAL_IN':
                case 'WAVE_RADIAL_OUT':
                    resolveAnimationRef.current = resolve;
                    currentAnimation.current = {
                        animation: animation,
                        ...createWaveRadialAnimation(animation),
                    };
                    break;
                case 'ANIMATE_BAR_CHANGE':
                    currentAnimation.current = {
                        animation: animation,
                        ...createBarChangeAnimation(animation),
                    };
                    break;
                case 'NO_ANIMATE_BAR_CHANGE':
                    // Special case: not really an animation, just set the bar data to the new bar heights
                    const { animationResultFunc } = createBarChangeNoAnimation(animation);
                    setBarData(animationResultFunc(1));
                    return;
                default:
                    throw new Error('Unknown animation type');
            }
            animationFrameRef.current = requestAnimationFrame(animateFrame);
        });
    }, []);

    const cancelAnimation = useCallback(() => {
        currentAnimation.current = null;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (resolveAnimationRef.current) {
            resolveAnimationRef.current();
            resolveAnimationRef.current = null;
        }
    }, []);

    return { barData, startAnimation, cancelAnimation };
}

const MIN_PULSE_HEIGHT = 1;
const MAX_PULSE_HEIGHT = 50;
// We multiply the progress by 1.1 so that the wave has time to complete its cycle.
const PROGRESS_ALL_WAY_COEFF = 1.1;
const WAVE_SPEED = 0.0005 / PROGRESS_ALL_WAY_COEFF;
const WAVE_WIDTH = 0.1;

const createWaveRadialAnimation = (animation: WaveRadialAnimation): { animationResultFunc: AnimationResultFunc, getProgress: () => number } => {
    const { centerLocation, otherStationLocations, type } = animation;
    const [centerX, centerY] = centerLocation;
    
    const maxDistance = Math.sqrt(
        Math.max(...Object.values(otherStationLocations).map(([lon, lat]) => 
          Math.pow(lon - centerX, 2) + Math.pow(lat - centerY, 2)
        ))
    );

    const startTime = Date.now();

    const getProgress = () => {
        return (Date.now() - startTime) * WAVE_SPEED;
    }

    const animationResultFunc = (progress: number) => {

        const stationIdToHeight = Object.entries(otherStationLocations).reduce((acc, [stationId, [lon, lat]]) => {
            if (lon === centerX && lat === centerY) {
                acc[stationId] = { currentHeight: 0 };
                return acc;
            }

            const distance = Math.sqrt(
                Math.pow(lon - centerX, 2) + Math.pow(lat - centerY, 2)
            );

            const normalizedDistance = distance / maxDistance;

            let distanceFromWave;
            if (type === 'WAVE_RADIAL_OUT') {
                distanceFromWave = Math.abs(normalizedDistance - progress * PROGRESS_ALL_WAY_COEFF);
            } else if (type === 'WAVE_RADIAL_IN') {
                distanceFromWave = Math.abs((1 - normalizedDistance) - progress * PROGRESS_ALL_WAY_COEFF);
            }

            const waveEffect = Math.max(0, 1 - (distanceFromWave / WAVE_WIDTH));
            const height = (MIN_PULSE_HEIGHT + (MAX_PULSE_HEIGHT - MIN_PULSE_HEIGHT) * waveEffect) * 0.00005;

            acc[stationId] = { currentHeight: height };
            return acc;
        }, {})

        return {
            type: 'LOADING' as const,
            heights: stationIdToHeight
        };
    }

    return { animationResultFunc, getProgress };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const ANIMATE_BAR_CHANGE_DURATION = 500;
const createBarChangeAnimation = (animation: BarChangeAnimation): { animationResultFunc: AnimationResultFunc, getProgress: () => number } => {
    const { initialBarHeights, newBarHeights } = animation;

    const startTime = Date.now();
    const getProgress = () => {
        return Math.min((Date.now() - startTime) / ANIMATE_BAR_CHANGE_DURATION, 1);
    }

    const animationResultFunc = (progress: number) => {
        const heights = Object.keys(stationIdToStation).reduce((acc, stationId) => {
            const initialHeight = initialBarHeights[stationId] ?? 0;
            const newBarHeight = newBarHeights[stationId] ?? 0;
            const newHeight = initialHeight + (newBarHeight - initialHeight) * easeOutCubic(progress);
            acc[stationId] = { currentHeight: newHeight };
            return acc;
        }, {});

        return {
            type: 'DATA' as const,
            heights: heights
        };
    }

    return { animationResultFunc, getProgress };
}

const createBarChangeNoAnimation = (animation: BarChangeNoAnimation): { animationResultFunc: AnimationResultFunc, getProgress: () => number } => {
    const { newBarHeights } = animation;

    const getProgress = () => 1;
    const animationResultFunc = (progress: number) => {
        const heights = Object.keys(stationIdToStation).reduce((acc, stationId) => {
            const newHeight = newBarHeights[stationId] ?? 0;
            acc[stationId] = { currentHeight: newHeight };
            return acc;
        }, {});

        return {
            type: 'DATA' as const,
            heights: heights
        };
    }

    return { animationResultFunc, getProgress };
}
