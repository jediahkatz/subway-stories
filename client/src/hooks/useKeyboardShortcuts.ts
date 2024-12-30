import { useEffect } from 'react';
import { trackEvent } from '../lib/analytics';

interface UseKeyboardShortcutsProps {
  onEnterGifMode: () => void;
  onExitGifMode: () => void;
  isGifMode: boolean;
}

export const useKeyboardShortcuts = ({
  onEnterGifMode,
  onExitGifMode,
  isGifMode,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+G (Mac) or Ctrl+G (Windows)
      if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
        event.preventDefault();
        if (!isGifMode) {
          trackEvent('gif_mode_entered', { method: 'keyboard_shortcut' });
          onEnterGifMode();
        }
      }
      
      // Check for Escape to exit GIF mode
      if (event.key === 'Escape' && isGifMode) {
        trackEvent('gif_mode_exited', { method: 'keyboard_shortcut' });
        onExitGifMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGifMode, onEnterGifMode, onExitGifMode]);
}; 