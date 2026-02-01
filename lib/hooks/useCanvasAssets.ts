"use client";

import { useQuery } from "@tanstack/react-query";
import { getCanvasAssets } from "@/lib/api/assets";
import { queryKeys } from "./queryKeys";

export function useCanvasAssets(canvasId: string) {
  return useQuery({
    queryKey: queryKeys.canvasAssets(canvasId),
    queryFn: () => getCanvasAssets(canvasId),
    enabled: !!canvasId,
  });
}
