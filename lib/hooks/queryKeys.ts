export const queryKeys = {
  // File queries
  files: (view: string, sort: string) => ["files", view, sort] as const,
  file: (id: string) => ["file", id] as const,

  // Asset queries
  fileAssets: (fileId: string) => ["assets", "file", fileId] as const,
  asset: (id: string) => ["asset", id] as const,
} as const;
