"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCanvas } from "@/lib/api/canvases";
import { queryKeys } from "./queryKeys";

export function useUpdateCanvas(canvasId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      viewport_x?: number;
      viewport_y?: number;
      viewport_scale?: number;
    }) => updateCanvas(canvasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.canvas(canvasId) });
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
