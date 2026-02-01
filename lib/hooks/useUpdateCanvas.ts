"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCanvas } from "@/lib/api/canvases";
import type { CanvasData } from "@/lib/api/canvases";

export function useUpdateCanvas(canvasId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; canvas_data?: CanvasData }) =>
      updateCanvas(canvasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas", canvasId] });
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
