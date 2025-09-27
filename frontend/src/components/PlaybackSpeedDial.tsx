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

const DEFAULT_SPEEDS = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

const ANGLE_STEP = 30;
const MIN_ANGLE = -120;
const MAX_ANGLE = 120;
const ANGLE_TOLERANCE = 15;
const DRAG_MIN_ANGLE = MIN_ANGLE - ANGLE_TOLERANCE;
const DRAG_MAX_ANGLE = MAX_ANGLE + ANGLE_TOLERANCE;
const MIN_INTERACTION_RADIUS = 56; // px

interface PlaybackSpeedDialProps {
  open: boolean;
  value: number;
  onValueChange: (value: number) => void;
  onOpenChange: (open: boolean) => void;
  speeds?: number[];
}

function formatRate(rate: number): string {
  const normalized = Math.round(rate * 100) / 100;
  const display = parseFloat(normalized.toFixed(2)).toString();
  return `${display}x`;
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

  const positions = useMemo(
    () =>
      speeds.map((speed, index) => ({
        speed,
        angle: MIN_ANGLE + ANGLE_STEP * index,
      })),
    [speeds]
  );

  const angleForIndex = useCallback(
    (index: number) => positions[index]?.angle ?? 0,
    [positions]
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

  const getClosestIndexByAngle = useCallback(
    (angle: number) => {
      if (positions.length === 0) return null;

      let closestIndex: number | null = null;
      let smallestDiff = Number.POSITIVE_INFINITY;

      positions.forEach(({ angle: targetAngle }, index) => {
        const diff = Math.abs(targetAngle - angle);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = index;
        }
      });

      if (closestIndex !== null && smallestDiff <= ANGLE_TOLERANCE) {
        return closestIndex;
      }

      return null;
    },
    [positions]
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

  const disabledArcStyle = useMemo<CSSProperties>(
    () => ({
      background:
        "conic-gradient(from -135deg, transparent 0deg 270deg, hsl(var(--muted-foreground) / 0.25) 270deg 360deg)",
      WebkitMask:
        "radial-gradient(circle, transparent 54%, black 58%, black 80%, transparent 84%)",
      mask: "radial-gradient(circle, transparent 54%, black 58%, black 80%, transparent 84%)",
    }),
    []
  );

  const highlightStyle = useMemo<CSSProperties | undefined>(() => {
    if (positions.length <= 1) return undefined;
    const start = pointerAngle - ANGLE_STEP / 2 - 90;
    const maskGradient =
      "radial-gradient(circle, transparent 58%, black 62%, black 80%, transparent 84%)";

    return {
      background: `conic-gradient(from ${start}deg, hsl(var(--primary) / 0.35) 0deg ${ANGLE_STEP}deg, transparent ${ANGLE_STEP}deg 360deg)`,
      WebkitMask: maskGradient,
      mask: maskGradient,
      transition: isDragging
        ? "none"
        : "background 0.18s ease-out, transform 0.18s ease-out",
    } satisfies CSSProperties;
  }, [isDragging, pointerAngle, positions.length]);

  const selectByAngle = useCallback(
    (angle: number) => {
      if (positions.length === 0) return;
      if (angle < DRAG_MIN_ANGLE || angle > DRAG_MAX_ANGLE) {
        return;
      }

      const constrained = Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, angle));
      const index = getClosestIndexByAngle(constrained);
      if (index === null) return;

      const next = positions[index]?.speed;
      if (typeof next === "number") {
        onValueChange(next);
      }
    },
    [getClosestIndexByAngle, onValueChange, positions]
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const dial = dialRef.current;
      if (!dial) return;

      const rect = dial.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (radius < MIN_INTERACTION_RADIUS) {
        return;
      }

      const angleRadians = Math.atan2(deltaX, -deltaY);
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
      if (positions.length === 0) return;
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (dominantDelta === 0) return;

      event.preventDefault();
      const direction = dominantDelta > 0 ? 1 : -1;
      const nextIndex = Math.min(
        positions.length - 1,
        Math.max(0, selectedIndex + direction)
      );
      const next = positions[nextIndex]?.speed;
      if (typeof next === "number" && next !== value) {
        onValueChange(next);
      }
    },
    [onValueChange, positions, selectedIndex, value]
  );

  const selectByIndex = useCallback(
    (index: number) => {
      if (positions.length === 0) return;

      const clamped = Math.min(positions.length - 1, Math.max(0, index));
      const next = positions[clamped]?.speed;

      if (typeof next === "number" && next !== value) {
        onValueChange(next);
      }
    },
    [onValueChange, positions, value]
  );

  const canDecrease = positions.length > 0 && selectedIndex > 0;
  const canIncrease =
    positions.length > 0 && selectedIndex < positions.length - 1;

  const handleSlowClick = useCallback(() => {
    if (!canDecrease) return;
    selectByIndex(selectedIndex - 1);
  }, [canDecrease, selectByIndex, selectedIndex]);

  const handleFastClick = useCallback(() => {
    if (!canIncrease) return;
    selectByIndex(selectedIndex + 1);
  }, [canIncrease, selectByIndex, selectedIndex]);

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

              <div
                className="pointer-events-none absolute inset-3 rounded-full"
                style={disabledArcStyle}
              />

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

              {positions.map(({ speed, angle }, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={speed}
                    className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(${-angle}deg)`,
                      transition: isDragging
                        ? "none"
                        : "transform 0.18s ease-out",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onValueChange(speed)}
                      className={clsx(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-background/70 text-muted-foreground hover:bg-muted"
                      )}
                      style={{
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                        transition: isDragging
                          ? "none"
                          : "transform 0.18s ease-out, background-color 0.18s ease-out, color 0.18s ease-out",
                      }}
                    >
                      {formatRate(speed)}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleSlowClick}
                disabled={!canDecrease}
                aria-disabled={!canDecrease}
                className={clsx(
                  "rounded-full px-3 py-1 font-medium transition",
                  canDecrease
                    ? "hover:bg-muted hover:text-foreground"
                    : "cursor-not-allowed opacity-30"
                )}
              >
                ゆっくり
              </button>
              <span className="text-[11px] tracking-wide text-muted-foreground/80">
                タップ・ドラッグ・スワイプで調整
              </span>
              <button
                type="button"
                onClick={handleFastClick}
                disabled={!canIncrease}
                aria-disabled={!canIncrease}
                className={clsx(
                  "rounded-full px-3 py-1 font-medium transition",
                  canIncrease
                    ? "hover:bg-muted hover:text-foreground"
                    : "cursor-not-allowed opacity-30"
                )}
              >
                速く
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
