"use client";

import { useQuery } from "@tanstack/react-query";
import { getCanvas } from "@/lib/api/canvases";
import { queryKeys } from "./queryKeys";

export function useCanvas(canvasId: string) {
  return useQuery({
    queryKey: queryKeys.canvas(canvasId),
    queryFn: () => getCanvas(canvasId),
    enabled: !!canvasId,
  });
}
