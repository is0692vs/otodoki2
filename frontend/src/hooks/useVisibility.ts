import { useEffect, useRef, useState, useCallback } from "react";

interface UseVisibilityOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  threshold?: number;
  rootMargin?: string;
}

export function useVisibility(options: UseVisibilityOptions = {}) {
  const { onVisibilityChange, threshold = 0.5, rootMargin = "0px" } = options;
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const observe = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      disconnect();

      const observer = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          onVisibilityChange?.(visible);
        },
        {
          threshold,
          rootMargin,
        }
      );

      observer.observe(element);
      observerRef.current = observer;
    },
    [disconnect, onVisibilityChange, threshold, rootMargin]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      observe(element);
    }

    return disconnect;
  }, [observe, disconnect]);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current = element;
      if (element) {
        observe(element);
      } else {
        disconnect();
      }
    },
    [observe, disconnect]
  );

  return {
    ref,
    isVisible,
  };
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
