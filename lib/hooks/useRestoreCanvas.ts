"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

async function restoreCanvas(canvasId: string) {
  return apiClient(`/api/canvases/${canvasId}/restore`, {
    method: "POST",
  });
}

export function useRestoreCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });
}
