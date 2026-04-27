"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type TooltipSide = "top" | "bottom";

type TooltipPosition = {
  left: number;
  top: number;
  side: TooltipSide;
};

type UseTooltipPositionResult = {
  hideTooltip: () => void;
  isActive: boolean;
  position: TooltipPosition | null;
  showTooltip: () => void;
  tooltipRef: RefObject<HTMLSpanElement | null>;
  wrapperRef: RefObject<HTMLSpanElement | null>;
};

const VIEWPORT_PADDING_PX = 8;
const TOOLTIP_GAP_PX = 8;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function resolveSide(
  preferredSide: TooltipSide,
  fitsAbove: boolean,
  fitsBelow: boolean,
) {
  if (preferredSide === "bottom") {
    return fitsBelow || !fitsAbove ? "bottom" : "top";
  }

  return fitsAbove || !fitsBelow ? "top" : "bottom";
}

function getVisibleViewport() {
  const visualViewport = window.visualViewport;
  const layoutViewportRight = document.documentElement.clientWidth;
  const layoutViewportBottom = window.innerHeight;

  if (visualViewport) {
    const left = visualViewport.offsetLeft;
    const top = visualViewport.offsetTop;
    const right = Math.min(left + visualViewport.width, layoutViewportRight);
    const bottom = Math.min(top + visualViewport.height, layoutViewportBottom);

    return {
      height: Math.max(0, bottom - top),
      left,
      top,
      width: Math.max(0, right - left),
    };
  }

  return {
    height: layoutViewportBottom,
    left: 0,
    top: 0,
    width: layoutViewportRight,
  };
}

export function useTooltipPosition(
  side: TooltipSide,
): UseTooltipPositionResult {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updateTooltipPosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;

    if (!wrapper || !tooltip) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = getVisibleViewport();
    const minLeft = viewport.left + VIEWPORT_PADDING_PX;
    const maxLeft =
      viewport.left + viewport.width - tooltipRect.width - VIEWPORT_PADDING_PX;
    const centeredLeftPosition =
      wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
    const topPositionBelowTrigger = wrapperRect.bottom + TOOLTIP_GAP_PX;
    const topPositionAboveTrigger =
      wrapperRect.top - tooltipRect.height - TOOLTIP_GAP_PX;
    const fitsBelow =
      topPositionBelowTrigger + tooltipRect.height <=
      viewport.top + viewport.height - VIEWPORT_PADDING_PX;
    const fitsAbove =
      topPositionAboveTrigger >= viewport.top + VIEWPORT_PADDING_PX;
    const resolvedSide = resolveSide(side, fitsAbove, fitsBelow);
    const unclampedTopPosition =
      resolvedSide === "bottom"
        ? topPositionBelowTrigger
        : topPositionAboveTrigger;

    // The tooltip is portaled out of the instrument tree to avoid clipping from
    // overflow/contain ancestors, then positioned inside the viewport.
    setPosition({
      left: clamp(centeredLeftPosition, minLeft, maxLeft),
      top: clamp(
        unclampedTopPosition,
        viewport.top + VIEWPORT_PADDING_PX,
        viewport.top +
          viewport.height -
          tooltipRect.height -
          VIEWPORT_PADDING_PX,
      ),
      side: resolvedSide,
    });
  }, [side]);

  const queueTooltipPositionUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updateTooltipPosition();
    });
  }, [updateTooltipPosition]);

  const showTooltip = useCallback(() => {
    setIsActive(true);
    queueTooltipPositionUpdate();
  }, [queueTooltipPositionUpdate]);

  const hideTooltip = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsActive(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    queueTooltipPositionUpdate();

    const handleViewportChange = () => {
      queueTooltipPositionUpdate();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportChange,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        handleViewportChange,
      );
    };
  }, [isActive, queueTooltipPositionUpdate]);

  return {
    hideTooltip,
    isActive,
    position,
    showTooltip,
    tooltipRef,
    wrapperRef,
  };
}
