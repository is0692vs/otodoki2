"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

const DEFAULT_SPEEDS = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3];
const ANGLE_RANGE = 240;
const MIN_ANGLE = -ANGLE_RANGE / 2;
const MAX_ANGLE = ANGLE_RANGE / 2;

interface PlaybackSpeedDialProps {
  open: boolean;
  value: number;
  onValueChange: (value: number) => void;
  onOpenChange: (open: boolean) => void;
  speeds?: number[];
}

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? `${rate.toFixed(0)}x` : `${rate.toFixed(1)}x`;
}

export function PlaybackSpeedDial({
  open,
  value,
  onValueChange,
  onOpenChange,
  speeds = DEFAULT_SPEEDS,
}: PlaybackSpeedDialProps) {
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const step = useMemo(() => {
    return speeds.length > 1 ? ANGLE_RANGE / (speeds.length - 1) : 0;
  }, [speeds]);

  const angleForIndex = useCallback(
    (index: number) => MIN_ANGLE + step * index,
    [step]
  );

  const clampAngle = useCallback((angle: number) => {
    return Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
  }, []);

  const getClosestIndexByAngle = useCallback(
    (angle: number) => {
      if (speeds.length === 0) return 0;
      let closestIndex = 0;
      let smallestDiff = Number.POSITIVE_INFINITY;

      speeds.forEach((_, index) => {
        const targetAngle = angleForIndex(index);
        const diff = Math.abs(targetAngle - angle);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = index;
        }
      });

      return closestIndex;
    },
    [angleForIndex, speeds]
  );

  const getClosestIndex = useCallback(
    (rate: number) => {
      if (speeds.length === 0) return 0;
      let closestIndex = 0;
      let smallestDiff = Number.POSITIVE_INFINITY;

      speeds.forEach((speed, index) => {
        const diff = Math.abs(speed - rate);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = index;
        }
      });

      return closestIndex;
    },
    [speeds]
  );

  const selectedIndex = useMemo(
    () => getClosestIndex(value),
    [getClosestIndex, value]
  );

  const pointerAngle = useMemo(
    () => angleForIndex(selectedIndex),
    [angleForIndex, selectedIndex]
  );

  const pointerStyle = useMemo<CSSProperties>(
    () => ({
      transform: `rotate(${pointerAngle}deg)`,
      transition: isDragging ? "none" : "transform 0.18s ease-out",
    }),
    [isDragging, pointerAngle]
  );

  const highlightStyle = useMemo<CSSProperties | undefined>(() => {
    if (speeds.length <= 1 || step === 0) return undefined;
    const sweep = Math.max(step, 12);
    const start = pointerAngle - sweep / 2 + 90;
    const maskGradient =
      "radial-gradient(circle, transparent 58%, black 59%, black 78%, transparent 79%)";

    return {
      background: `conic-gradient(from ${start}deg, hsl(var(--primary) / 0.25) 0deg ${sweep}deg, transparent ${sweep}deg 360deg)`,
      WebkitMask: maskGradient,
      mask: maskGradient,
      transition: isDragging
        ? "none"
        : "background 0.18s ease-out, transform 0.18s ease-out",
    } satisfies CSSProperties;
  }, [isDragging, pointerAngle, speeds.length, step]);

  const selectByAngle = useCallback(
    (angle: number) => {
      if (speeds.length === 0) return;
      const clamped = clampAngle(angle);
      const index = getClosestIndexByAngle(clamped);
      const next = speeds[index];
      if (typeof next === "number") {
        onValueChange(next);
      }
    },
    [clampAngle, getClosestIndexByAngle, onValueChange, speeds]
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const dial = dialRef.current;
      if (!dial) return;

      const rect = dial.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = centerY - clientY;
      const angleRadians = Math.atan2(deltaY, deltaX);
      const angleDegrees = (angleRadians * 180) / Math.PI;

      selectByAngle(angleDegrees);
    },
    [selectByAngle]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dialRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      event.preventDefault();
      updateFromPointer(event.clientX, event.clientY);
    },
    [isDragging, updateFromPointer]
  );

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (dialRef.current?.hasPointerCapture(event.pointerId)) {
        dialRef.current.releasePointerCapture(event.pointerId);
      }
      endDrag();
    },
    [endDrag]
  );

  useEffect(() => {
    if (!open) return;

    const cancelDrag = () => endDrag();
    window.addEventListener("pointerup", cancelDrag);
    window.addEventListener("pointercancel", cancelDrag);

    return () => {
      window.removeEventListener("pointerup", cancelDrag);
      window.removeEventListener("pointercancel", cancelDrag);
    };
  }, [endDrag, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  const handleBackdropClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleContainerClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    []
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (speeds.length === 0) return;
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (dominantDelta === 0) return;

      event.preventDefault();
      const direction = dominantDelta > 0 ? 1 : -1;
      const nextIndex = Math.min(
        speeds.length - 1,
        Math.max(0, selectedIndex + direction)
      );
      const next = speeds[nextIndex];
      if (typeof next === "number" && next !== value) {
        onValueChange(next);
      }
    },
    [onValueChange, selectedIndex, speeds, value]
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-background/95 p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={handleContainerClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  再生速度
                </p>
                <p className="text-3xl font-semibold">{formatRate(value)}</p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                onClick={() => onOpenChange(false)}
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={dialRef}
              className={clsx(
                "relative mx-auto mt-6 flex h-64 w-64 select-none items-center justify-center rounded-full",
                "bg-gradient-to-br from-muted/70 via-background to-muted/50 shadow-inner"
              )}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            >
              <div className="absolute inset-6 rounded-full border border-border/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-background px-4 py-3 text-4xl font-semibold shadow">
                  {formatRate(value)}
                </div>
              </div>

              {highlightStyle ? (
                <div
                  className="pointer-events-none absolute inset-3 rounded-full"
                  style={highlightStyle}
                />
              ) : null}

              <div
                className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-start justify-center"
                style={pointerStyle}
              >
                <div className="h-20 w-1 rounded-full bg-primary shadow-lg" />
                <div className="mt-2 h-3 w-3 rounded-full bg-primary shadow" />
              </div>

              {speeds.map((speed, index) => {
                const angle = angleForIndex(index);
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={speed}
                    className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(${-angle}deg)`,
                      transition: isDragging
                        ? "none"
                        : "transform 0.18s ease-out",
                    }}
                  >
                    <span
                      className={clsx(
                        "select-none rounded-full px-3 py-1 text-sm font-medium transition",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-background/70 text-muted-foreground"
                      )}
                      style={{
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                        transition: isDragging
                          ? "none"
                          : "transform 0.18s ease-out, background-color 0.18s ease-out, color 0.18s ease-out",
                      }}
                    >
                      {formatRate(speed)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
              <span>ゆっくり</span>
              <span className="col-span-2">タップまたはドラッグで調整</span>
              <span>速く</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
