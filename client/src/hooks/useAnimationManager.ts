import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimationFrame {
  value: number | number[] | string;
  duration: number;
}

interface Animation {
  field: 'hour' | 'months' | 'day';
  frames: AnimationFrame[];
  type?: 'linear' | 'cubic';
}

interface DataSettings {
  newSelectedHour?: number;
  newSelectedMonths?: number[];
  newSelectedDay?: string;
}

interface UseAnimationManagerProps {
  onAnimationTick: (params: { 
    newDataSettings: DataSettings;
    mousePosition: { x: number; y: number; };
  }) => Promise<void>;
}

export const useAnimationManager = ({ onAnimationTick }: UseAnimationManagerProps) => {
  const [animation, setAnimation] = useState<Animation | null>(null);

  const mousePosition = useTrackMousePositionRef();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (animation) {
      let frameIndex = 0;
      const animateFrame = () => {
        if (frameIndex < animation.frames.length) {
          const frame = animation.frames[frameIndex];
          const newDataSettings: DataSettings = {};
          
          if (animation.field === 'hour') {
            newDataSettings.newSelectedHour = frame.value as number;
          } else if (animation.field === 'months') {
            newDataSettings.newSelectedMonths = frame.value as number[];
          } else if (animation.field === 'day') {
            newDataSettings.newSelectedDay = frame.value as string;
          }

          onAnimationTick({ 
            newDataSettings,
            mousePosition: mousePosition.current
          });

          timeoutId = setTimeout(() => {
            frameIndex++;
            animateFrame();
          }, frame.duration);
        } else {
          // Animation complete, restart
          frameIndex = 0;
          animateFrame();
        }
      };
      animateFrame();
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animation, onAnimationTick]);

  return { animation, setAnimation };
}; 

const useTrackMousePositionRef = () => {
  const mousePosition = useRef({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e) => {
    mousePosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return mousePosition;
}