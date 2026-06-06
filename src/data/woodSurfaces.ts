export const woodSurfaces = {
  rosewood: {
    title: "Rosewood",
    background:
      "linear-gradient(to bottom, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02) 24%, rgb(0 0 0 / 0.24)), linear-gradient(91deg, rgb(113 70 47 / 0.18) 0%, rgb(72 43 31 / 0.28) 12%, rgb(130 80 55 / 0.12) 24%, rgb(67 38 28 / 0.24) 39%, rgb(148 92 64 / 0.1) 52%, rgb(64 38 28 / 0.26) 68%, rgb(120 75 50 / 0.12) 81%, rgb(56 31 23 / 0.26) 100%), linear-gradient(to right, rgb(111 71 48) 0%, rgb(90 55 38) 18%, rgb(68 41 29) 42%, rgb(86 51 37) 63%, rgb(63 38 27) 81%, rgb(105 65 48) 100%)",
  },
  maple: {
    title: "Maple",
    background:
      "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.2)), linear-gradient(91deg, rgb(255 255 255 / 0.02) 0%, rgb(255 255 255 / 0.02) 7%, rgb(148 102 62 / 0.08) 16%, rgb(255 255 255 / 0.02) 29%, rgb(166 112 68 / 0.1) 43%, rgb(255 255 255 / 0.02) 58%, rgb(136 91 53 / 0.08) 71%, rgb(255 255 255 / 0.03) 84%, rgb(160 108 64 / 0.08) 100%), linear-gradient(to right, rgb(212 179 129) 0%, rgb(200 159 107) 14%, rgb(188 140 88) 31%, rgb(202 156 103) 47%, rgb(173 119 68) 68%, rgb(193 142 88) 84%, rgb(200 155 103) 100%)",
  },
  ebony: {
    title: "Ebony",
    background:
      "linear-gradient(to bottom, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.01) 24%, rgb(0 0 0 / 0.28)), linear-gradient(91deg, rgb(90 80 68 / 0.08) 0%, rgb(35 30 28 / 0.22) 18%, rgb(82 73 63 / 0.06) 34%, rgb(24 22 22 / 0.24) 51%, rgb(70 63 55 / 0.08) 68%, rgb(18 18 19 / 0.26) 100%), linear-gradient(to right, rgb(45 41 40) 0%, rgb(28 26 27) 22%, rgb(18 18 19) 48%, rgb(26 25 25) 72%, rgb(42 37 35) 100%)",
  },
  pauFerro: {
    title: "Pau Ferro",
    background:
      "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03) 24%, rgb(0 0 0 / 0.22)), linear-gradient(91deg, rgb(186 126 78 / 0.08) 0%, rgb(110 71 45 / 0.16) 15%, rgb(201 141 89 / 0.06) 29%, rgb(88 57 38 / 0.18) 46%, rgb(171 116 72 / 0.08) 62%, rgb(84 54 37 / 0.18) 79%, rgb(148 98 61 / 0.08) 100%), linear-gradient(to right, rgb(154 99 63) 0%, rgb(126 79 49) 19%, rgb(102 63 41) 42%, rgb(122 75 49) 64%, rgb(92 56 37) 84%, rgb(138 88 58) 100%)",
  },
} as const;

export const woodSurfaceOptions = Object.keys(woodSurfaces) as WoodSurfaceId[];

export const DEFAULT_WOOD_SURFACE_ID = "rosewood" satisfies WoodSurfaceId;

export type WoodSurfaceId = keyof typeof woodSurfaces;

export function normalizeWoodSurfaceId(
  value: unknown,
): WoodSurfaceId | undefined {
  return typeof value === "string" && value in woodSurfaces
    ? (value as WoodSurfaceId)
    : undefined;
}
