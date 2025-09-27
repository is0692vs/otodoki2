"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

const DEFAULT_SPEEDS = [0.5, 0.8, 1, 1.2, 1.5, 1.8, 2, 2.5];
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

  const selectByAngle = useCallback(
    (angle: number) => {
      if (speeds.length === 0) return;
      const clamped = clampAngle(angle);
      const ratio = (clamped - MIN_ANGLE) / ANGLE_RANGE;
      const index = Math.round(ratio * (speeds.length - 1));
      const next = speeds[index];
      if (typeof next === "number") {
        onValueChange(next);
      }
    },
    [clampAngle, onValueChange, speeds]
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
            >
              <div className="absolute inset-6 rounded-full border border-border/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-background px-4 py-3 text-4xl font-semibold shadow">
                  {formatRate(value)}
                </div>
              </div>

              <div
                className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-start justify-center"
                style={{ transform: `rotate(${pointerAngle}deg)` }}
              >
                <div className="h-20 w-1 rounded-full bg-primary shadow-lg" />
                <div className="mt-2 h-3 w-3 rounded-full bg-primary shadow" />
              </div>

              {speeds.map((speed, index) => {
                const angle = angleForIndex(index);
                return (
                  <div
                    key={speed}
                    className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(${-angle}deg)`,
                    }}
                  >
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full px-3 py-1 text-sm transition",
                        index === selectedIndex
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-background/70 text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => onValueChange(speed)}
                    >
                      {formatRate(speed)}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
              <span>ゆっくり</span>
              <span className="col-span-2">タップまたはドラッグで調整</span>
              <span>速く</span>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {speeds.map((speed) => (
                <button
                  key={`quick-${speed}`}
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm transition",
                    speed === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                  onClick={() => onValueChange(speed)}
                >
                  {formatRate(speed)}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
