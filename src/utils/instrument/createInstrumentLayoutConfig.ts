import {
  type InstrumentLayoutConfig,
  type InstrumentSize,
  type InstrumentWidthMode,
  type ResolvedInstrumentLayoutConfig,
} from "@/types/instrument-layout";

export const instrumentLayoutDefaults = {
  size: "comfortable",
  scale: 1,
  widthMode: "auto",
} satisfies Pick<
  ResolvedInstrumentLayoutConfig,
  "size" | "scale" | "widthMode"
>;

const INSTRUMENT_SIZES = ["compact", "comfortable", "large"] as const;
const INSTRUMENT_WIDTH_MODES = ["auto", "fill", "scroll"] as const;
const SCALE_MIN = 0.5;
const SCALE_MAX = 2;

const DIMENSION_KEYS = [
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
] satisfies readonly (keyof InstrumentLayoutConfig)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInstrumentSize(value: unknown): value is InstrumentSize {
  return INSTRUMENT_SIZES.includes(value as InstrumentSize);
}

function isInstrumentWidthMode(value: unknown): value is InstrumentWidthMode {
  return INSTRUMENT_WIDTH_MODES.includes(value as InstrumentWidthMode);
}

function clampScale(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(Math.max(value, SCALE_MIN), SCALE_MAX);
}

function normalizeDimension(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

/**
 * Returns a small, serializable layout object suitable for persisted Zustand
 * state. Defaults and invalid values are omitted; when nothing remains, this
 * returns undefined so the layout field can be left out of persisted JSON.
 */
export function normalizeInstrumentLayoutConfig(
  layout: unknown,
): InstrumentLayoutConfig | undefined {
  const input = isRecord(layout) ? layout : {};
  const normalized: InstrumentLayoutConfig = {};

  const size = isInstrumentSize(input.size) ? input.size : undefined;
  if (size !== undefined && size !== instrumentLayoutDefaults.size) {
    normalized.size = size;
  }

  const scale = clampScale(input.scale);
  if (scale !== undefined && scale !== instrumentLayoutDefaults.scale) {
    normalized.scale = scale;
  }

  const widthMode = isInstrumentWidthMode(input.widthMode)
    ? input.widthMode
    : undefined;
  if (
    widthMode !== undefined &&
    widthMode !== instrumentLayoutDefaults.widthMode
  ) {
    normalized.widthMode = widthMode;
  }

  DIMENSION_KEYS.forEach((key) => {
    const dimension = normalizeDimension(input[key]);
    if (dimension) {
      normalized[key] = dimension;
    }
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Runtime config for rendering. This applies defaults to a normalized storable
 * config and should be recomputed instead of persisted.
 */
export function createInstrumentLayoutConfig(
  layout: unknown,
): ResolvedInstrumentLayoutConfig {
  const normalizedLayout = normalizeInstrumentLayoutConfig(layout) ?? {};

  return {
    ...normalizedLayout,
    size: normalizedLayout.size ?? instrumentLayoutDefaults.size,
    scale: normalizedLayout.scale ?? instrumentLayoutDefaults.scale,
    widthMode: normalizedLayout.widthMode ?? instrumentLayoutDefaults.widthMode,
  };
}
