import { useState, useEffect, useCallback } from 'react';

const NUM_CIRCLES = 3;
const ANIMATION_DURATION = 3000;

export function useDotPulseAnimation(direction: string) {
  const [circles, setCircles] = useState(() => Array(NUM_CIRCLES).fill({ scale: 1, opacity: 0 }));

  const animate = useCallback((timestamp: number) => {
    setCircles(prevCircles => {
      const startTime = timestamp - (timestamp % ANIMATION_DURATION);
      const progress = (timestamp - startTime) % ANIMATION_DURATION;
      const normalizedProgress = progress / ANIMATION_DURATION 

      return Array(NUM_CIRCLES).fill(0).map((_, index) => {
        const offset = index / NUM_CIRCLES;
        let adjustedProgress = (normalizedProgress + offset) % 1;

        // Reverse the animation for 'comingFrom' direction
        if (direction === 'comingFrom') {
          adjustedProgress = 1 - adjustedProgress;
        }

        const scale = 1 + adjustedProgress * 5; // Expand from 0 to 2x size
        const opacity = Math.max(0, 1 - adjustedProgress) * 200; // Fade out
        return { scale, opacity };
      });
    });
  }, [direction]);

  useEffect(() => {
    let animationFrame: number;

    const runAnimation = (timestamp: number) => {
      animate(timestamp);
      animationFrame = requestAnimationFrame(runAnimation);
    };

    animationFrame = requestAnimationFrame(runAnimation);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [animate]);

  return circles;
}