import { type CSSProperties } from "react";
import {
  type InstrumentIntrinsicSizing,
  type InstrumentSize,
  type InstrumentWidthMode,
} from "@/types/instrument-layout";
import { createInstrumentLayoutConfig } from "./createInstrumentLayoutConfig";

interface ResolvedInstrumentLayout {
  style: CSSProperties;
  widthMode: InstrumentWidthMode;
}

const DEFAULT_SIZING: InstrumentIntrinsicSizing = {
  preferredWidth: 640,
  preferredHeight: 128,
  minReadableWidth: 280,
  minHeight: 96,
  maxHeight: 320,
};

const SIZE_SCALE: Record<InstrumentSize, number> = {
  compact: 0.84,
  comfortable: 1,
  large: 1.18,
};

function toPx(value: number): string {
  return `${Math.round(value)}px`;
}

export function resolveInstrumentLayout(
  sizing: InstrumentIntrinsicSizing | undefined,
  layout: unknown,
): ResolvedInstrumentLayout {
  const baseSizing = sizing ?? DEFAULT_SIZING;
  const layoutConfig = createInstrumentLayoutConfig(layout);
  const scale = SIZE_SCALE[layoutConfig.size] * layoutConfig.scale;

  return {
    widthMode: layoutConfig.widthMode,
    style: {
      "--instrument-preferred-width":
        layoutConfig.width ?? toPx(baseSizing.preferredWidth * scale),
      "--instrument-preferred-height":
        layoutConfig.height ?? toPx(baseSizing.preferredHeight * scale),
      "--instrument-min-readable-width":
        layoutConfig.minWidth ?? toPx(baseSizing.minReadableWidth * scale),
      "--instrument-max-width": layoutConfig.maxWidth ?? "100%",
      "--instrument-min-height":
        layoutConfig.minHeight ?? toPx(baseSizing.minHeight * scale),
      "--instrument-max-height":
        layoutConfig.maxHeight ?? toPx(baseSizing.maxHeight * scale),
    } as CSSProperties,
  };
}
