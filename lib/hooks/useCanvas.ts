"use client";

import { useQuery } from "@tanstack/react-query";
import { getCanvas } from "@/lib/api/canvases";

export function useCanvas(canvasId: string) {
  return useQuery({
    queryKey: ["canvas", canvasId],
    queryFn: () => getCanvas(canvasId),
    enabled: !!canvasId,
  });
}
