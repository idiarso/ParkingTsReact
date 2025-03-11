import { useEffect } from 'react';

interface ShortcutHandlers {
  onSubmit?: () => void;
  onClear?: () => void;
  onFocusPlate?: () => void;
  onVehicleType?: (type: string) => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handlers.onSubmit?.();
      }

      // Ctrl/Cmd + L to clear
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        handlers.onClear?.();
      }

      // Alt + P to focus plate number input
      if (event.altKey && event.key === 'p') {
        event.preventDefault();
        handlers.onFocusPlate?.();
      }

      // Quick vehicle type selection
      if (event.altKey) {
        switch (event.key) {
          case '1':
            handlers.onVehicleType?.('car');
            break;
          case '2':
            handlers.onVehicleType?.('motorcycle');
            break;
          case '3':
            handlers.onVehicleType?.('truck');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}; 