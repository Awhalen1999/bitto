"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

async function permanentDeleteCanvas(canvasId: string) {
  return apiClient(`/api/canvases/${canvasId}/permanent`, {
    method: "DELETE",
  });
}

export function usePermanentDeleteCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentDeleteCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
