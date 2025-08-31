import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  onSpacePress?: () => void;
  onEscape?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabledWhenFocused?: boolean;
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    onSpacePress,
    onEscape,
    onArrowLeft,
    onArrowRight,
    enabledWhenFocused = false,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Skip if shortcuts are disabled when not focused
      if (enabledWhenFocused && document.activeElement !== document.body) {
        return;
      }

      switch (event.code) {
        case "Space":
          if (onSpacePress) {
            event.preventDefault();
            onSpacePress();
          }
          break;
        case "Escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSpacePress, onEscape, onArrowLeft, onArrowRight, enabledWhenFocused]);
}
