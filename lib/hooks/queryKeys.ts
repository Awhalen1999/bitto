export const queryKeys = {
  // Canvas queries
  canvases: (view: string, sort: string) => ["canvases", view, sort] as const,
  canvas: (id: string) => ["canvas", id] as const,

  // Asset queries
  canvasAssets: (canvasId: string) => ["assets", "canvas", canvasId] as const,
  asset: (id: string) => ["asset", id] as const,
} as const;
